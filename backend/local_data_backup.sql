--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: SiteGroup; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."SiteGroup" VALUES ('b7de44a8-86fc-4ee4-91f9-c9ea857844b1', '서울권역', 'HQ', NULL, 'CIRCLE', '#1890ff', 0, true, '2025-10-16 05:56:48.676', '2025-10-16 05:56:48.676', NULL);
INSERT INTO public."SiteGroup" VALUES ('c652a358-5192-4403-865c-6be694a52008', '영남권역', 'YEONGNAM', NULL, 'CIRCLE', '#1890ff', 0, true, '2025-10-16 05:56:48.679', '2025-10-16 05:56:48.679', NULL);


--
-- Data for Name: Site; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Site" VALUES ('c95eb984-c21f-4b75-8ae0-8812ae605b14', '서울 본사 사옥', 'CONSIGNMENT', 'HQ', 'b7de44a8-86fc-4ee4-91f9-c9ea857844b1', '서울시 강남구 테헤란로 14길 6', 37.4979, 127.0276, '김담당', '02-1234-5678', NULL, NULL, 8000.00, '본사 직배', '2024-01-01', '2025-12-31', 1, true, '2025-10-16 05:56:48.682', '2025-10-16 05:56:48.682', NULL);
INSERT INTO public."Site" VALUES ('751fccf7-296d-44e8-a934-e8c87f842223', '부산 지사', 'DELIVERY', 'YEONGNAM', 'c652a358-5192-4403-865c-6be694a52008', '부산시 해운대구 센텀중앙로 78', 35.1688, 129.1313, '이담당', '051-1234-5678', NULL, NULL, 7500.00, '부산 배송', '2024-01-01', '2025-12-31', 2, true, '2025-10-16 05:56:48.687', '2025-10-16 05:56:48.687', NULL);
INSERT INTO public."Site" VALUES ('a7e5b761-84d8-442f-a38b-e0d48ef3afed', '대구 공장', 'LUNCHBOX', 'YEONGNAM', 'c652a358-5192-4403-865c-6be694a52008', '대구시 달서구 성서공단로 11길 39', 35.8314, 128.5311, '박담당', '053-1234-5678', NULL, NULL, 7000.00, '대구 배송', '2024-01-01', '2025-12-31', 3, true, '2025-10-16 05:56:48.689', '2025-10-16 05:56:48.689', NULL);


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."User" VALUES ('bb71a46e-60ea-442a-8c99-83ba88d56d3c', 'admin@daham.com', '$2b$10$IALxj.PQk0Gg5/yPPSBMNeiO1PCdSy.6XyZkgobw59GvqXbNYI0eK', '관리자', '01012345678', 'SUPER_ADMIN', 'HQ', true, NULL, '2025-10-16 05:56:48.665', '2025-10-16 05:56:48.665', NULL);
INSERT INTO public."User" VALUES ('b15ca15f-ac58-4e88-9276-e44f3553f701', 'staff1@daham.com', '$2b$10$IALxj.PQk0Gg5/yPPSBMNeiO1PCdSy.6XyZkgobw59GvqXbNYI0eK', '홍길동', '01011111111', 'SITE_STAFF', 'HQ', true, NULL, '2025-10-16 05:56:48.69', '2025-10-16 05:56:48.69', NULL);
INSERT INTO public."User" VALUES ('467b4626-862c-4d52-ab35-eea1e5b0f9fc', 'staff2@daham.com', '$2b$10$IALxj.PQk0Gg5/yPPSBMNeiO1PCdSy.6XyZkgobw59GvqXbNYI0eK', '김영희', '01022222222', 'SITE_STAFF', 'YEONGNAM', true, NULL, '2025-10-16 05:56:48.698', '2025-10-16 05:56:48.698', NULL);
INSERT INTO public."User" VALUES ('d56d6af7-71b7-4a8a-afc1-abd25d3f6462', 'client1@company.com', '$2b$10$IALxj.PQk0Gg5/yPPSBMNeiO1PCdSy.6XyZkgobw59GvqXbNYI0eK', '이고객', '01033333333', 'CLIENT', 'HQ', true, NULL, '2025-10-16 05:56:48.7', '2025-10-16 05:56:48.7', NULL);


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: AttendanceSetting; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: CustomerFeedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."CustomerFeedback" VALUES ('befb5b66-0d4c-420b-9fb0-9933ad4c14d5', 'c95eb984-c21f-4b75-8ae0-8812ae605b14', 'd56d6af7-71b7-4a8a-afc1-abd25d3f6462', 'CLIENT', '음식이 맛있었습니다. 감사합니다!', 5, '2025-10-16', 'LUNCH', 'RESOLVED', NULL, NULL, NULL, '2025-10-16 05:56:48.705', '2025-10-16 05:56:48.705', NULL);
INSERT INTO public."CustomerFeedback" VALUES ('f7d7607f-518b-480b-bc01-922e9d208fa9', 'c95eb984-c21f-4b75-8ae0-8812ae605b14', 'b15ca15f-ac58-4e88-9276-e44f3553f701', 'STAFF', '양이 좀 부족한 것 같습니다.', 3, '2025-10-16', 'LUNCH', 'PENDING', NULL, NULL, NULL, '2025-10-16 05:56:48.705', '2025-10-16 05:56:48.705', NULL);


--
-- Data for Name: FeedbackImage; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: MealCount; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: MealCountSetting; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: MealPhoto; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Menu; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Menu" VALUES ('8b91f61d-8194-4252-a140-8e1ce471f3d8', 'c95eb984-c21f-4b75-8ae0-8812ae605b14', '2025-10-16', '2025-10-16', 'LUNCH', NULL, NULL, '제육볶음, 김치찌개, 계란말이, 시금치나물, 배추김치', NULL, '2025-10-16 05:56:48.701', '2025-10-16 05:56:48.701', NULL);
INSERT INTO public."Menu" VALUES ('cd59d4c9-699c-4573-97b0-1d9ea4d7d8c8', 'c95eb984-c21f-4b75-8ae0-8812ae605b14', '2025-10-17', '2025-10-17', 'LUNCH', NULL, NULL, '불고기, 된장찌개, 계란후라이, 콩나물무침, 깍두기', NULL, '2025-10-16 05:56:48.701', '2025-10-16 05:56:48.701', NULL);
INSERT INTO public."Menu" VALUES ('13bc29bd-2299-4bfa-90f8-9cfa4d7b6a07', '751fccf7-296d-44e8-a934-e8c87f842223', '2025-10-16', '2025-10-16', 'LUNCH', NULL, NULL, '돈까스, 미역국, 감자샐러드, 단무지, 배추김치', NULL, '2025-10-16 05:56:48.701', '2025-10-16 05:56:48.701', NULL);


--
-- Data for Name: MenuType; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: SiteMenuType; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Staff; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Staff" VALUES ('c8548d5a-2341-45c0-b917-77d5386d8a0e', 'b15ca15f-ac58-4e88-9276-e44f3553f701', 'EMP001', '운영팀', '팀장', NULL, 0, '2025-10-16 05:56:48.69', '2025-10-16 05:56:48.69', NULL);
INSERT INTO public."Staff" VALUES ('ed725125-3ab7-44ef-b720-be767d1a9669', '467b4626-862c-4d52-ab35-eea1e5b0f9fc', 'EMP002', '영업팀', '대리', NULL, 0, '2025-10-16 05:56:48.698', '2025-10-16 05:56:48.698', NULL);


--
-- Data for Name: StaffSite; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."StaffSite" VALUES ('f967b216-35a0-4f48-a2b2-54f72dc20bab', 'c8548d5a-2341-45c0-b917-77d5386d8a0e', 'c95eb984-c21f-4b75-8ae0-8812ae605b14', true, '2025-10-16 05:56:48.695', NULL);
INSERT INTO public."StaffSite" VALUES ('afcc6435-596b-4bb4-ad82-c901588dfb9d', 'ed725125-3ab7-44ef-b720-be767d1a9669', '751fccf7-296d-44e8-a934-e8c87f842223', true, '2025-10-16 05:56:48.699', NULL);


--
-- Data for Name: WeeklyMenuTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- PostgreSQL database dump complete
--

