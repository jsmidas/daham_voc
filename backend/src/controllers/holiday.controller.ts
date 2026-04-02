/**
 * Holiday Controller
 * @description 공휴일 관리 컨트롤러
 */

import { Request, Response } from 'express';
import * as holidayService from '../services/holiday.service';
import { successResponse, errorResponse } from '../utils/api-response.util';

export async function getHolidays(req: Request, res: Response): Promise<void> {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const holidays = await holidayService.getHolidaysByYear(year);
    res.json(successResponse(holidays));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

export async function createHoliday(req: Request, res: Response): Promise<void> {
  try {
    const { date, name } = req.body;
    if (!date || !name) {
      res.status(400).json(errorResponse('날짜와 이름은 필수입니다'));
      return;
    }
    const holiday = await holidayService.createHoliday({ date, name });
    res.status(201).json(successResponse(holiday, '공휴일이 추가되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

export async function updateHoliday(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const holiday = await holidayService.updateHoliday(id, { name });
    res.json(successResponse(holiday, '공휴일이 수정되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

export async function deleteHoliday(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await holidayService.deleteHoliday(id);
    res.json(successResponse(null, '공휴일이 삭제되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}
