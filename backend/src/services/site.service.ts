import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { Division, SiteType } from '@prisma/client';
import { calculatePagination } from '../utils/pagination.util';
import * as XLSX from 'xlsx';
import axios from 'axios';

export interface SiteFilter {
  type?: SiteType;
  division?: Division;
  groupId?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CreateSiteDto {
  name: string;
  type: SiteType;
  division: Division;
  groupId?: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPerson1?: string;
  contactPhone1?: string;
  contactPerson2?: string;
  contactPhone2?: string;
  menuTypeIds?: string[];
  pricePerMeal?: number;
  deliveryRoute?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  staffIds?: string[];
}

export interface UpdateSiteDto {
  name?: string;
  type?: SiteType;
  division?: Division;
  groupId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactPerson1?: string;
  contactPhone1?: string;
  contactPerson2?: string;
  contactPhone2?: string;
  menuTypeIds?: string[];
  mealMenuIds?: string[];
  pricePerMeal?: number;
  deliveryRoute?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  staffIds?: string[];
  isActive?: boolean;
}

export class SiteService {
  /**
   * Convert address to coordinates using Kakao API
   */
  private async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number }> {
    const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
    if (!KAKAO_API_KEY) {
      console.warn('KAKAO_API_KEY not configured - geocoding will fail');
      throw new Error('Kakao API key not configured');
    }

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
        },
        params: {
          query: address,
        },
        signal: controller.signal as any,
      });

      clearTimeout(timeout);

      if (response.data.documents && response.data.documents.length > 0) {
        const { x, y } = response.data.documents[0].address || response.data.documents[0].road_address;
        return {
          latitude: parseFloat(y),
          longitude: parseFloat(x),
        };
      }

      throw new Error(`주소를 찾을 수 없습니다: ${address}`);
    } catch (error: any) {
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        throw new Error(`주소 변환 타임아웃 (${address}): 5초 초과`);
      }
      if (error.response) {
        throw new Error(`주소 변환 실패 (${address}): ${error.response.data.message || error.message}`);
      }
      throw new Error(`주소 변환 실패 (${address}): ${error.message}`);
    }
  }

  /**
   * Get sites with filtering, pagination, and caching
   */
  async getSites(filter: SiteFilter, pagination: PaginationParams, user?: any) {
    const cacheKey = `sites:${JSON.stringify({ filter, pagination, userRole: user?.role })}`;

    // Check Redis cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build filter conditions
    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (filter.type) where.type = filter.type;

    // Division 필터링: HQ_ADMIN은 HQ + CONSIGNMENT 모두 조회
    if (filter.division) {
      where.division = filter.division;
    } else if (user && user.role === 'HQ_ADMIN') {
      where.division = { in: ['HQ', 'CONSIGNMENT'] };
    }

    if (filter.groupId) where.groupId = filter.groupId;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { address: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const { skip, take } = calculatePagination(pagination);

    // Fetch data
    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        skip,
        take,
        include: {
          group: true,
          staffSites: {
            include: {
              staff: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          routeStops: {
            where: {
              isActive: true,
            },
            include: {
              route: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  color: true,
                  division: true,
                },
              },
            },
            orderBy: {
              stopNumber: 'asc',
            },
          },
          _count: {
            select: {
              menus: true,
              mealPhotos: true,
              feedbacks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.site.count({ where }),
    ]);

    const result = { sites, total };

    // Cache result for 10 minutes
    await cache.set(cacheKey, JSON.stringify(result), 600);

    return result;
  }

  /**
   * Get site by ID
   */
  async getSiteById(id: string, userId: string) {
    const site = await prisma.site.findUnique({
      where: { id, isActive: true },
      include: {
        group: true,
        staffSites: {
          include: {
            staff: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
        siteMenuTypes: {
          include: {
            menuType: true,
          },
        },
        menus: {
          take: 10,
          orderBy: { startDate: 'desc' },
        },
        mealPhotos: {
          take: 10,
          orderBy: { capturedAt: 'desc' },
        },
        feedbacks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            menus: true,
            mealPhotos: true,
            feedbacks: true,
            attendances: true,
          },
        },
      },
    });

    if (!site) {
      throw new Error('사업장을 찾을 수 없습니다');
    }

    // Check view permission
    await this.checkViewPermission(site, userId);

    return site;
  }

  /**
   * Create site
   */
  async createSite(data: CreateSiteDto, userId: string) {
    // Check permission (division)
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    if (user.role === 'HQ_ADMIN' && data.division !== 'HQ' && data.division !== 'CONSIGNMENT') {
      throw new Error('본사 관리자는 본사 및 위탁 사업장만 생성할 수 있습니다');
    }

    if (user.role === 'YEONGNAM_ADMIN' && data.division !== 'YEONGNAM') {
      throw new Error('영남지사 관리자는 영남지사 사업장만 생성할 수 있습니다');
    }

    // Check if site with same name already exists
    const existingSite = await prisma.site.findFirst({
      where: {
        name: data.name,
        isActive: true,
        deletedAt: null,
      },
    });

    if (existingSite) {
      throw new Error(`이미 동일한 이름의 사업장이 존재합니다: ${data.name}`);
    }

    // Create site
    const site = await prisma.site.create({
      data: {
        name: data.name,
        type: data.type,
        division: data.division,
        groupId: data.groupId,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        contactPerson1: data.contactPerson1,
        contactPhone1: data.contactPhone1,
        contactPerson2: data.contactPerson2,
        contactPhone2: data.contactPhone2,
        pricePerMeal: data.pricePerMeal,
        deliveryRoute: data.deliveryRoute,
        contractStartDate: data.contractStartDate,
        contractEndDate: data.contractEndDate,
        staffSites: data.staffIds
          ? {
              create: data.staffIds.map((staffId, index) => ({
                staffId,
                isPrimary: index === 0,
              })),
            }
          : undefined,
        siteMenuTypes: data.menuTypeIds
          ? {
              create: data.menuTypeIds.map((menuTypeId) => ({
                menuTypeId,
              })),
            }
          : undefined,
      },
      include: {
        group: true,
        staffSites: {
          include: {
            staff: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return site;
  }

  /**
   * Update site
   */
  async updateSite(id: string, data: UpdateSiteDto, userId: string) {
    // Check permission
    await this.checkPermission(id, userId);

    // If name is being changed, check for duplicates
    if (data.name) {
      const existingSite = await prisma.site.findFirst({
        where: {
          name: data.name,
          id: { not: id }, // Exclude current site
          isActive: true,
          deletedAt: null,
        },
      });

      if (existingSite) {
        throw new Error(`이미 동일한 이름의 사업장이 존재합니다: ${data.name}`);
      }
    }

    const site = await prisma.site.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        division: data.division,
        groupId: data.groupId,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        contactPerson1: data.contactPerson1,
        contactPhone1: data.contactPhone1,
        contactPerson2: data.contactPerson2,
        contactPhone2: data.contactPhone2,
        pricePerMeal: data.pricePerMeal,
        deliveryRoute: data.deliveryRoute,
        contractStartDate: data.contractStartDate,
        contractEndDate: data.contractEndDate,
        isActive: data.isActive,
        staffSites: data.staffIds
          ? {
              deleteMany: {},
              create: data.staffIds.map((staffId, index) => ({
                staffId,
                isPrimary: index === 0,
              })),
            }
          : undefined,
        siteMenuTypes: data.menuTypeIds
          ? {
              deleteMany: {},
              create: data.menuTypeIds.map((menuTypeId) => ({
                menuTypeId,
              })),
            }
          : undefined,
      },
      include: {
        group: true,
        staffSites: {
          include: {
            staff: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // 식수 메뉴 할당 처리
    if (data.mealMenuIds !== undefined) {
      // 기존 할당 삭제
      await prisma.siteMealMenu.deleteMany({
        where: { siteId: id },
      });

      // 새 메뉴 할당
      if (data.mealMenuIds.length > 0) {
        await prisma.siteMealMenu.createMany({
          data: data.mealMenuIds.map((mealMenuId, index) => ({
            siteId: id,
            mealMenuId,
            sortOrder: index,
          })),
        });
      }
    }

    await this.invalidateCache();
    return site;
  }

  /**
   * Delete site (soft delete)
   */
  async deleteSite(id: string, userId: string) {
    await this.checkPermission(id, userId);

    await prisma.site.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await this.invalidateCache();
  }

  /**
   * Check if user has permission to modify site
   */
  private async checkPermission(siteId: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const site = await prisma.site.findUnique({ where: { id: siteId } });

    if (!site) {
      throw new Error('사업장을 찾을 수 없습니다');
    }

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    if (user.role === 'SUPER_ADMIN') return;

    if (user.role === 'HQ_ADMIN' && site.division !== 'HQ' && site.division !== 'CONSIGNMENT') {
      throw new Error('권한이 없습니다');
    }

    if (user.role === 'YEONGNAM_ADMIN' && site.division !== 'YEONGNAM') {
      throw new Error('권한이 없습니다');
    }
  }

  /**
   * Check if user has permission to view site
   */
  private async checkViewPermission(site: any, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { staff: true },
    });

    if (!user) {
      throw new Error('인증 정보가 만료되었습니다. 다시 로그인해주세요.');
    }

    if (user.role === 'SUPER_ADMIN') {
      return;
    }

    if (user.role === 'HQ_ADMIN' && site.division !== 'HQ' && site.division !== 'CONSIGNMENT') {
      throw new Error('권한이 없습니다');
    }

    if (user.role === 'YEONGNAM_ADMIN' && site.division !== 'YEONGNAM') {
      throw new Error('권한이 없습니다');
    }

    if (user.role === 'SITE_STAFF' || user.role === 'SITE_MANAGER' || user.role === 'DELIVERY_DRIVER') {
      const isAssigned = site.staffSites.some(
        (ss: any) => ss.staff.userId === userId
      );
      if (!isAssigned) {
        throw new Error('담당 사업장이 아닙니다');
      }
    }
  }

  /**
   * Update site order (sortOrder)
   */
  async updateSiteOrder(siteId: string, newOrder: number, userId: string) {
    // Check permission
    await this.checkPermission(siteId, userId);

    await prisma.site.update({
      where: { id: siteId },
      data: { sortOrder: newOrder },
    });

    await this.invalidateCache();

    // Also invalidate site-groups cache
    const groupKeys = await cache.keys('site-groups:*');
    if (groupKeys.length > 0) {
      await cache.del(...groupKeys);
    }
  }

  /**
   * Batch update site orders
   */
  async batchUpdateSiteOrders(updates: { siteId: string; sortOrder: number }[], userId: string) {
    // Check permissions for all sites
    for (const update of updates) {
      await this.checkPermission(update.siteId, userId);
    }

    // Update all sites
    await prisma.$transaction(
      updates.map((update) =>
        prisma.site.update({
          where: { id: update.siteId },
          data: { sortOrder: update.sortOrder },
        })
      )
    );

    await this.invalidateCache();

    // Also invalidate site-groups cache
    const groupKeys = await cache.keys('site-groups:*');
    if (groupKeys.length > 0) {
      await cache.del(...groupKeys);
    }
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache() {
    const keys = await cache.keys('sites:*');
    if (keys.length > 0) {
      await cache.del(...keys);
    }
  }

  /**
   * Generate Excel template for bulk site registration
   */
  async generateExcelTemplate(): Promise<Buffer> {
    const wb = XLSX.utils.book_new();

    // Create sample data with headers
    const sampleData = [
      {
        '사업장명': '예시 사업장',
        '유형': 'SCHOOL',
        '부문': 'HQ',
        '그룹ID': '',
        '주소': '서울시 강남구 테헤란로 14길 6',
        '담당자1': '홍길동',
        '연락처1': '010-1234-5678',
        '담당자2': '김철수',
        '연락처2': '010-9876-5432',
        '단가': 5000,
        '배송코스': 'A코스',
        '계약시작일': '2025-01-01',
        '계약종료일': '2025-12-31',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // 사업장명
      { wch: 12 }, // 유형
      { wch: 12 }, // 부문
      { wch: 36 }, // 그룹ID
      { wch: 40 }, // 주소
      { wch: 12 }, // 담당자1
      { wch: 15 }, // 연락처1
      { wch: 12 }, // 담당자2
      { wch: 15 }, // 연락처2
      { wch: 10 }, // 단가
      { wch: 12 }, // 배송코스
      { wch: 12 }, // 계약시작일
      { wch: 12 }, // 계약종료일
    ];

    XLSX.utils.book_append_sheet(wb, ws, '사업장 목록');

    // Add instructions sheet
    const instructions = [
      { 항목: '사업장명', 설명: '사업장 이름 (필수)', 예시: '서울초등학교' },
      { 항목: '유형', 설명: '위탁, 운반급식, 도시락, 행사 중 선택 (필수)', 예시: '위탁' },
      { 항목: '부문', 설명: '본사, 영남지사 중 선택 (필수)', 예시: '본사' },
      { 항목: '그룹ID', 설명: '그룹 이름 또는 UUID (선택) - 예: "본사", "영남지사A코스" 등', 예시: '본사' },
      { 항목: '주소', 설명: '사업장 주소 (필수) - 위도/경도는 자동 변환됩니다', 예시: '서울시 강남구 테헤란로 14길 6' },
      { 항목: '담당자1', 설명: '주 담당자 이름 (선택)', 예시: '홍길동' },
      { 항목: '연락처1', 설명: '주 담당자 연락처 (선택)', 예시: '010-1234-5678' },
      { 항목: '담당자2', 설명: '부 담당자 이름 (선택)', 예시: '김철수' },
      { 항목: '연락처2', 설명: '부 담당자 연락처 (선택)', 예시: '010-9876-5432' },
      { 항목: '단가', 설명: '끼니당 단가 (선택)', 예시: '5000' },
      { 항목: '배송코스', 설명: '배송 코스 (선택)', 예시: 'A코스' },
      { 항목: '계약시작일', 설명: '계약 시작일 YYYY-MM-DD (선택)', 예시: '2025-01-01' },
      { 항목: '계약종료일', 설명: '계약 종료일 YYYY-MM-DD (선택)', 예시: '2025-12-31' },
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [
      { wch: 15 },
      { wch: 50 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsInstructions, '작성 가이드');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Parse and validate Excel file for bulk site creation
   */
  async bulkCreateFromExcel(
    fileBuffer: Buffer,
    userId: string
  ): Promise<{ success: number; failed: Array<{ row: number; error: string; data: any }> }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // Read Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      throw new Error('엑셀 파일에 데이터가 없습니다');
    }

    const results: { success: number; failed: Array<{ row: number; error: string; data: any }> } = {
      success: 0,
      failed: [],
    };

    // 배송코스 자동 생성을 위한 캐시 (중복 생성 방지)
    const deliveryRouteCache = new Map<string, string>(); // key: route name, value: route id

    // 배송코스 색상 팔레트
    const routeColors = [
      '#1890ff', // 파랑
      '#52c41a', // 초록
      '#faad14', // 노랑
      '#f5222d', // 빨강
      '#722ed1', // 보라
      '#fa8c16', // 주황
      '#13c2c2', // 청록
      '#eb2f96', // 분홍
      '#2f54eb', // 남색
      '#a0d911', // 연두
    ];
    let colorIndex = 0;

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      const rowNumber = i + 2; // Excel row number (1-indexed + header)

      try {
        // Validate required fields
        if (!row['사업장명']) {
          throw new Error('사업장명은 필수입니다');
        }
        if (!row['유형']) {
          throw new Error('유형은 필수입니다');
        }
        if (!row['부문']) {
          throw new Error('부문은 필수입니다');
        }
        if (!row['주소']) {
          throw new Error('주소는 필수입니다');
        }

        // Map Korean labels to enum values
        const typeMapping: Record<string, string> = {
          '위탁': 'CONSIGNMENT',
          '운반': 'DELIVERY',
          '운반급식': 'DELIVERY',
          '도시락': 'LUNCHBOX',
          '행사': 'EVENT',
          // Also support English values directly
          'CONSIGNMENT': 'CONSIGNMENT',
          'DELIVERY': 'DELIVERY',
          'LUNCHBOX': 'LUNCHBOX',
          'EVENT': 'EVENT',
        };

        const mappedType = typeMapping[row['유형']];
        if (!mappedType) {
          throw new Error(`유형은 위탁, 운반급식, 도시락, 행사 중 하나여야 합니다 (입력값: ${row['유형']})`);
        }

        // Map Korean division labels to enum values
        const divisionMapping: Record<string, string> = {
          '본사': 'HQ',
          'HQ': 'HQ',
          '영남': 'YEONGNAM',
          '영남지사': 'YEONGNAM',
          'YEONGNAM': 'YEONGNAM',
        };

        const mappedDivision = divisionMapping[row['부문']];
        if (!mappedDivision) {
          throw new Error(`부문은 본사, 영남지사 중 하나여야 합니다 (입력값: ${row['부문']})`);
        }

        // Check permission
        if (user.role === 'HQ_ADMIN' && mappedDivision !== 'HQ') {
          throw new Error('본사 관리자는 본사 사업장만 생성할 수 있습니다');
        }

        if (user.role === 'YEONGNAM_ADMIN' && mappedDivision !== 'YEONGNAM') {
          throw new Error('영남지사 관리자는 영남지사 사업장만 생성할 수 있습니다');
        }

        // Parse dates
        let contractStartDate: Date | undefined;
        let contractEndDate: Date | undefined;

        if (row['계약시작일']) {
          contractStartDate = new Date(row['계약시작일']);
          if (isNaN(contractStartDate.getTime())) {
            throw new Error('계약시작일 형식이 올바르지 않습니다 (YYYY-MM-DD)');
          }
        }

        if (row['계약종료일']) {
          contractEndDate = new Date(row['계약종료일']);
          if (isNaN(contractEndDate.getTime())) {
            throw new Error('계약종료일 형식이 올바르지 않습니다 (YYYY-MM-DD)');
          }
        }

        // Convert address to coordinates using Kakao API with timeout
        let latitude = 0;
        let longitude = 0;

        try {
          const coords = await this.geocodeAddress(row['주소']);
          latitude = coords.latitude;
          longitude = coords.longitude;
        } catch (geocodeError: any) {
          // Log geocoding error but continue with default coordinates
          console.warn(`⚠️  Geocoding failed for row ${rowNumber} (${row['사업장명']}): ${geocodeError.message}`);
          // Use default coordinates (0, 0) if geocoding fails
        }

        // Add delay to respect API rate limits (200ms between requests for stability)
        await new Promise(resolve => setTimeout(resolve, 200));

        // Validate groupId if provided (supports both UUID and group name)
        let validatedGroupId: string | undefined = undefined;
        if (row['그룹ID'] && row['그룹ID'].trim() !== '') {
          const groupInput = row['그룹ID'].trim();

          // Try to find by ID first (UUID format)
          let group = await prisma.siteGroup.findUnique({
            where: { id: groupInput },
          });

          // If not found, try to find by name (한글 이름으로 검색)
          if (!group) {
            group = await prisma.siteGroup.findFirst({
              where: {
                name: groupInput,
                division: mappedDivision as Division,
                isActive: true,
              },
            });
          }

          if (group) {
            validatedGroupId = group.id;
          } else {
            console.warn(`Group not found for row ${rowNumber}: ${groupInput} (tried both ID and name)`);
            // Continue without groupId instead of failing
          }
        }

        // Check if site with same name already exists
        const existingSite = await prisma.site.findFirst({
          where: {
            name: row['사업장명'],
            isActive: true,
            deletedAt: null,
          },
        });

        const siteData = {
          name: row['사업장명'],
          type: mappedType as SiteType,
          division: mappedDivision as Division,
          groupId: validatedGroupId,
          address: row['주소'],
          latitude,
          longitude,
          contactPerson1: row['담당자1'] || undefined,
          contactPhone1: row['연락처1'] || undefined,
          contactPerson2: row['담당자2'] || undefined,
          contactPhone2: row['연락처2'] || undefined,
          pricePerMeal: row['단가'] ? parseFloat(row['단가']) : undefined,
          deliveryRoute: row['배송코스'] || undefined,
          contractStartDate,
          contractEndDate,
        };

        let createdOrUpdatedSite;
        if (existingSite) {
          // Update existing site
          createdOrUpdatedSite = await prisma.site.update({
            where: { id: existingSite.id },
            data: siteData,
          });
        } else {
          // Create new site
          createdOrUpdatedSite = await prisma.site.create({
            data: siteData,
          });
        }

        // 배송코스 처리 (배송코스가 입력된 경우)
        if (row['배송코스'] && row['배송코스'].trim() !== '') {
          const routeName = row['배송코스'].trim();

          // 배송코스 ID 가져오기 또는 생성
          let deliveryRouteId = deliveryRouteCache.get(routeName);

          if (!deliveryRouteId) {
            // 기존 배송코스 찾기 (여러 형태로 검색)
            // 예: "C코스" → "본사중식 C", "본사중식C", "C" 등으로 찾기
            let deliveryRoute = await prisma.deliveryRoute.findFirst({
              where: {
                OR: [
                  { name: routeName }, // 정확히 일치
                  { name: { contains: routeName.replace('코스', '').trim() } }, // "C코스" → "C" 포함
                  { code: routeName.replace('코스', '').trim() }, // "C코스" → code가 "C"
                ],
                division: mappedDivision as Division,
                deletedAt: null,
              },
            });

            if (!deliveryRoute) {
              // 새 배송코스 생성
              const routeCode = routeName
                .replace(/[^a-zA-Z0-9가-힣]/g, '')
                .substring(0, 10)
                .toUpperCase() || `ROUTE_${Date.now()}`;

              deliveryRoute = await prisma.deliveryRoute.create({
                data: {
                  name: routeName,
                  code: routeCode,
                  division: mappedDivision as Division,
                  description: `엑셀 업로드를 통해 자동 생성된 배송코스`,
                  color: routeColors[colorIndex % routeColors.length],
                  isActive: true,
                },
              });

              colorIndex++;
            }

            deliveryRouteId = deliveryRoute.id;
            deliveryRouteCache.set(routeName, deliveryRouteId);
          }

          // 이미 코스에 등록된 사업장인지 확인
          const existingStop = await prisma.deliveryRouteStop.findUnique({
            where: {
              routeId_siteId: {
                routeId: deliveryRouteId,
                siteId: createdOrUpdatedSite.id,
              },
            },
          });

          if (!existingStop) {
            // 현재 코스의 마지막 순서 번호 가져오기
            const lastStop = await prisma.deliveryRouteStop.findFirst({
              where: {
                routeId: deliveryRouteId,
                isActive: true,
              },
              orderBy: {
                stopNumber: 'desc',
              },
            });

            const nextStopNumber = lastStop ? lastStop.stopNumber + 1 : 1;

            // 배송코스에 사업장 추가
            await prisma.deliveryRouteStop.create({
              data: {
                routeId: deliveryRouteId,
                siteId: createdOrUpdatedSite.id,
                stopNumber: nextStopNumber,
                isActive: true,
              },
            });
          }
        }

        results.success++;
      } catch (error: any) {
        console.error(`❌ Failed to process row ${rowNumber}: ${error.message}`);
        results.failed.push({
          row: rowNumber,
          error: error.message,
          data: row,
        });
      }
    }

    // Invalidate cache
    await this.invalidateCache();

    // Log final summary
    if (results.failed.length > 0) {
    }

    return results;
  }

  /**
   * Get lightweight sites list (for dropdowns, selects, etc.)
   * @description 관계 데이터 없이 기본 사업장 정보만 반환 (빠른 로딩)
   */
  async getSitesLight(filter: { division?: Division; isActive?: boolean } = {}, user?: any) {
    const cacheKey = `sites-light:${JSON.stringify({ filter, userRole: user?.role })}`;

    // Check Redis cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build filter conditions
    const where: any = {
      isActive: filter.isActive !== false,
      deletedAt: null,
    };

    // Division 필터링
    if (filter.division) {
      where.division = filter.division;
    } else if (user && user.role === 'HQ_ADMIN') {
      where.division = { in: ['HQ', 'CONSIGNMENT'] };
    } else if (user && user.role === 'YEONGNAM_ADMIN') {
      where.division = 'YEONGNAM';
    }

    // 경량 쿼리 - 관계 데이터 최소화
    const sites = await prisma.site.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        division: true,
        address: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    // Cache for 5 minutes
    await cache.set(cacheKey, JSON.stringify(sites), 300);

    return sites;
  }

  /**
   * Get sites assigned to a specific user
   * @description 사용자에게 배정된 사업장 목록 반환 (개별 배정 + 그룹 배정)
   */
  async getUserAssignedSites(userId: string) {
    const staff: any = await prisma.staff.findUnique({
      where: { userId },
      include: {
        staffSites: {
          where: { removedAt: null },
          include: {
            site: {
              include: {
                group: {
                  select: {
                    id: true,
                    name: true,
                    division: true,
                  },
                },
              },
            },
          },
        },
        staffSiteGroups: {
          where: { removedAt: null },
          include: {
            siteGroup: {
              include: {
                sites: {
                  include: {
                    group: {
                      select: {
                        id: true,
                        name: true,
                        division: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!staff) {
      return [];
    }

    // 개별 배정 사업장 수집 (활성 사업장만)
    const individualSites = (staff.staffSites || [])
      .map((ss: any) => ss.site)
      .filter((site: any) => site.isActive && !site.deletedAt);

    // 그룹 배정 사업장 수집 (활성 사업장만)
    const groupSites = (staff.staffSiteGroups || [])
      .flatMap((sg: any) => sg.siteGroup.sites)
      .filter((site: any) => site.isActive && !site.deletedAt);

    // 중복 제거 (id 기준)
    const siteMap = new Map();
    [...individualSites, ...groupSites].forEach((site: any) => {
      siteMap.set(site.id, site);
    });

    return Array.from(siteMap.values());

  }
  /**
   * Get sites not assigned to any delivery route
   * @description 배송 코스에 배정되지 않은 사업장 목록 반환 (거래중인 사업장만)
   */
  async getUnassignedSites(user?: any) {
    const cacheKey = `sites-unassigned:${user?.role || 'all'}`;

    // Check Redis cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build filter conditions
    const where: any = {
      isActive: true,
      deletedAt: null,
      // 배송 코스에 배정되지 않은 사업장 (활성 배정만 확인)
      routeStops: {
        none: {
          isActive: true,
        },
      },
    };

    // Division 필터링
    if (user && user.role === 'HQ_ADMIN') {
      where.division = { in: ['HQ', 'CONSIGNMENT'] };
    } else if (user && user.role === 'YEONGNAM_ADMIN') {
      where.division = 'YEONGNAM';
    }

    const sites = await prisma.site.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        division: true,
        address: true,
        createdAt: true,
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = {
      count: sites.length,
      sites,
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }
}
