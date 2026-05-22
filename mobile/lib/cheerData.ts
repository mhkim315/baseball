import type { CheerSection, PlayerCheer } from "@shared/types";

export const CHEER_SONGS: Record<string, CheerSection[]> = {
  doosan: [
    { title: "경기시작", songs: [
      { name: "라인업송", youtubeUrl: "https://youtu.be/WVeqUV4Cp2Q" },
    ]},
    { title: "초반 분위기 올릴 때", songs: [
      { name: "가자 두산베어스", youtubeUrl: "https://youtu.be/A78K-zYjpjs" },
      { name: "야야야 두산", youtubeUrl: "https://youtu.be/Kjve3oW9gjY" },
      { name: "우리 두산 멋진 두산", youtubeUrl: "https://youtu.be/ZMwKOJFVEGA" },
      { name: "우리의 베어스", youtubeUrl: "https://youtu.be/ykUpQAvo3Og" },
    ]},
    { title: "후반 리드 상황, 승부처", songs: [
      { name: "ROCK TO THE DOOSAN", youtubeUrl: "https://youtube.com/shorts/lEUwxbrVbwk" },
      { name: "다 함께 허슬두", youtubeUrl: "https://youtube.com/shorts/xfSoaTe0bnI" },
      { name: "두산 승리하리라", youtubeUrl: "https://youtube.com/shorts/If7DZ8pPhqs" },
      { name: "서울두산 승리하리라", youtubeUrl: "https://youtube.com/shorts/Ah31o3IQ7A4" },
      { name: "승리를 위하여", youtubeUrl: "https://youtube.com/shorts/Uiby7yyUZ1g" },
    ]},
    { title: "상황별 응원", songs: [
      { name: "안타송1", youtubeUrl: "https://youtube.com/shorts/BJeAaLHdJBw" },
      { name: "안타송2", youtubeUrl: "https://youtube.com/shorts/ifr42sTdhk0" },
      { name: "안타송3", youtubeUrl: "https://youtube.com/shorts/RrC6UZP1cHo" },
      { name: "안타송4(new)", youtubeUrl: "https://youtube.com/shorts/Xdf-bZ0d26E" },
      { name: "볼넷송", youtubeUrl: "https://youtube.com/shorts/qUtm9Gk72YE" },
      { name: "풀카운트송", youtubeUrl: "https://youtube.com/shorts/yKtXauaAi3U" },
      { name: "견제구호", youtubeUrl: "https://youtube.com/shorts/bzHwTysINnM" },
    ]},
  ],
  lg: [
    { title: "경기시작", songs: [
      { name: "라인업송", youtubeUrl: "https://youtu.be/7ScyCvH9aMs" },
    ]},
    { title: "초반 분위기 올릴 때", songs: [
      { name: "사랑한다 LG", youtubeUrl: "https://youtube.com/shorts/uX0j6qt_IC4" },
      { name: "나의 사랑 서울 LG", youtubeUrl: "https://youtube.com/shorts/NnR-ZGHdzFU" },
      { name: "뉴셀리오", youtubeUrl: "https://youtube.com/shorts/Kp9UT6QZip4" },
      { name: "LG 없이는 못 살아", youtubeUrl: "https://youtube.com/shorts/_5EvF1V3l9E" },
      { name: "서울 메들리", youtubeUrl: "https://youtube.com/shorts/AM0L3YJPFUY" },
    ]},
    { title: "후반 리드 상황, 승부처", songs: [
      { name: "LG의 승리를 위하여", youtubeUrl: "https://youtube.com/shorts/HehtCP-SOoI" },
      { name: "최후의 결투", youtubeUrl: "https://youtu.be/ctCEN81Bit8" },
      { name: "서울의 아리아", youtubeUrl: "https://youtu.be/VcYP02oXyhY" },
      { name: "승리의 노래", youtubeUrl: "https://youtu.be/CTzmOIRO9Fo" },
    ]},
    { title: "상황별 응원", songs: [
      { name: "박수 안타송", youtubeUrl: "https://youtube.com/shorts/4gsWic9pu8A" },
      { name: "볼넷송", youtubeUrl: "https://youtube.com/shorts/g5ZK7VFj0po" },
      { name: "풀카운트송", youtubeUrl: "https://youtube.com/shorts/CezQ44VJ1UM" },
      { name: "견제구호", youtubeUrl: "https://youtube.com/shorts/OlipRnlJNXw" },
    ]},
  ],
  kiwoom: [
    { title: "경기시작", songs: [
      { name: "라인업송", youtubeUrl: "https://youtu.be/JJ2bqOL7zcM" },
    ]},
    { title: "초반 분위기 올릴 때", songs: [
      { name: "히어로즈의 노래", youtubeUrl: "https://youtu.be/RQIyUmU5Mlc" },
      { name: "영웅출정가", youtubeUrl: "https://youtu.be/antR6UYqZKk" },
      { name: "꿈이여 하나가 되자", youtubeUrl: "https://youtu.be/jFkiL_xb5aU" },
      { name: "나의 사랑 히어로", youtubeUrl: "https://youtube.com/shorts/rFP_WriqXEs" },
      { name: "외쳐라 히어로즈", youtubeUrl: "https://youtube.com/shorts/tzLxWlefqUo" },
    ]},
    { title: "후반 리드 상황, 승부처", songs: [
      { name: "승리를 위한 함성", youtubeUrl: "https://youtu.be/7p2U-yr-clQ" },
      { name: "승리를 위하여", youtubeUrl: "https://youtube.com/shorts/3WRJhvt_4Dw" },
      { name: "히어로즈의 노래", youtubeUrl: "https://youtu.be/p6hN2g45Vrg" },
      { name: "승리가", youtubeUrl: "https://youtube.com/shorts/CYQOsD4ieF0" },
      { name: "영웅필승", youtubeUrl: "https://youtube.com/shorts/VyI2BCsAcgw" },
    ]},
    { title: "상황별 응원", songs: [
      { name: "안타송1", youtubeUrl: "https://youtube.com/shorts/792Xz2Zjg4U" },
      { name: "안타송2", youtubeUrl: "https://youtube.com/shorts/GrleUSf6kh4" },
      { name: "볼넷송", youtubeUrl: "https://youtube.com/shorts/e0whVbCjnTw" },
      { name: "풀카운트송", youtubeUrl: "https://youtube.com/shorts/Q-2Fdb6lfPk" },
      { name: "견제구호", youtubeUrl: "https://youtu.be/rFdtL_hSZ4U" },
    ]},
  ],
  ssg: [
    { title: "경기시작", songs: [
      { name: "라인업송", youtubeUrl: "https://youtu.be/axNBIsmuhOw" },
    ]},
    { title: "초반 분위기 올릴 때", songs: [
      { name: "Let's GO", youtubeUrl: "https://youtube.com/shorts/mzDMNtxrcLk" },
      { name: "We are the LANDERS", youtubeUrl: "https://youtube.com/shorts/DaM59e1fJDM" },
      { name: "되고송", youtubeUrl: "https://youtube.com/shorts/4R90jp4JGP8" },
      { name: "불꽃투혼 랜더스", youtubeUrl: "https://youtube.com/shorts/1EjkcjFJWP8" },
      { name: "외쳐라 랜더스", youtubeUrl: "https://youtube.com/shorts/-QM1yKB3N3c" },
    ]},
    { title: "후반 리드 상황, 승부처", songs: [
      { name: "승리를 외쳐라", youtubeUrl: "https://youtube.com/shorts/CLWqun-Aydg" },
      { name: "랜더스의 승리 위해", youtubeUrl: "https://youtube.com/shorts/qo-DbmAbKtQ" },
      { name: "승리의 깃발", youtubeUrl: "https://youtube.com/shorts/s-0SfPbxtk4" },
    ]},
    { title: "상황별 응원", songs: [
      { name: "안타송1", youtubeUrl: "https://youtube.com/shorts/jvgM_s53PNc" },
      { name: "안타송2", youtubeUrl: "https://youtube.com/shorts/_4b9u5RllpI" },
      { name: "볼넷송", youtubeUrl: "https://youtube.com/shorts/Y4IySsA3xig" },
      { name: "풀카운트송", youtubeUrl: "https://youtube.com/shorts/J1-4iodsgl0" },
      { name: "견제구호", youtubeUrl: "https://youtube.com/shorts/dDGDBxnMUVk" },
    ]},
  ],
  kt: [
    { title: "경기시작", songs: [
      { name: "라인업송", youtubeUrl: "https://youtube.com/shorts/xNNA-qoq9ak" },
    ]},
    { title: "초반 분위기 올릴 때", songs: [
      { name: "우리는 kt wiz", youtubeUrl: "https://youtube.com/shorts/YYPVYurOI0o" },
      { name: "kt wiz 영원하리라", youtubeUrl: "https://youtu.be/-Ht1KU1Kl6E" },
      { name: "oh kt wiz", youtubeUrl: "https://youtube.com/shorts/dTZ_YCc4OJo" },
      { name: "we are the kt wiz", youtubeUrl: "https://youtu.be/6KOt2GUbV5E" },
      { name: "승리하라 kt wiz", youtubeUrl: "https://youtube.com/shorts/RDJA0qHmzUI" },
    ]},
    { title: "후반 리드 상황, 승부처", songs: [
      { name: "승리를 위하여", youtubeUrl: "https://youtube.com/shorts/wzHWdZQ9qZQ" },
      { name: "승리를 향해 비상하라", youtubeUrl: "https://youtu.be/ZQe89wNm_C0" },
      { name: "승리의 함성", youtubeUrl: "https://youtu.be/Qhv8gTonjp0" },
    ]},
    { title: "상황별 응원", songs: [
      { name: "안타송1", youtubeUrl: "https://youtube.com/shorts/7Bgn6WgVtVE" },
      { name: "볼넷송", youtubeUrl: "https://youtube.com/shorts/y-Zs-h-yJcw" },
      { name: "풀카운트송", youtubeUrl: "https://youtube.com/shorts/nCVrljQlboA" },
      { name: "견제구호", youtubeUrl: "https://youtube.com/shorts/fa-N43DmKSQ" },
    ]},
  ],
  hanwha: [
    { title: "경기시작", songs: [
      { name: "라인업송", youtubeUrl: "https://youtu.be/m7Mrwn5PCmc" },
    ]},
    { title: "초반 분위기 올릴 때", songs: [
      { name: "사랑한다 최강한화", youtubeUrl: "https://youtube.com/shorts/Q-BUM86krTg" },
      { name: "행복송", youtubeUrl: "https://youtube.com/shorts/Fp3CvpnQw4E" },
      { name: "그대에게", youtubeUrl: "https://youtube.com/shorts/zRrrnRW0sg8" },
      { name: "사랑한다 이글스", youtubeUrl: "https://youtube.com/shorts/dVezo16FWwY" },
      { name: "불타는태양", youtubeUrl: "https://youtube.com/shorts/rr97iT_fNLE" },
    ]},
    { title: "후반 리드 상황, 승부처", songs: [
      { name: "열광", youtubeUrl: "https://youtu.be/gd6ZJzvxMCA" },
      { name: "승리위해 외쳐라", youtubeUrl: "https://youtu.be/kr9CUIt3Auk" },
      { name: "내 사랑 한화, 내 사랑 이글스", youtubeUrl: "https://youtube.com/shorts/Sqltx-SMEX8" },
      { name: "우리들의 열정", youtubeUrl: "https://youtube.com/shorts/pzac7MsML-g" },
      { name: "영원히 최강한화", youtubeUrl: "https://youtube.com/shorts/oblGwwYFk9w" },
      { name: "영원한 챔프", youtubeUrl: "https://youtube.com/shorts/2WSMfDdQ9pw" },
    ]},
    { title: "상황별 응원", songs: [
      { name: "안타송1", youtubeUrl: "https://youtube.com/shorts/Z01O1g3XVso" },
      { name: "안타송2", youtubeUrl: "https://youtube.com/shorts/P-oITayNKGc" },
      { name: "안타송3", youtubeUrl: "https://youtube.com/shorts/sggOCodHwb0" },
      { name: "볼넷송", youtubeUrl: "https://youtube.com/shorts/Imsjs9k_Tto" },
      { name: "풀카운트송", youtubeUrl: "https://youtube.com/shorts/JnkUui4tg9U" },
      { name: "견제구호", youtubeUrl: "https://youtube.com/shorts/gofVayg84tg" },
    ]},
  ],
  samsung: [
    { title: "경기시작", songs: [
      { name: "라인업송", youtubeUrl: "https://youtu.be/0XjcQ_Xh_gc" },
    ]},
    { title: "초반 분위기 올릴 때", songs: [
      { name: "환희", youtubeUrl: "https://youtube.com/shorts/P4k1wJwF9eg" },
      { name: "투게더", youtubeUrl: "https://youtube.com/shorts/ZmN92AMr0KI" },
      { name: "혼연일체", youtubeUrl: "https://youtube.com/shorts/-7WJ0OvI6dE" },
      { name: "Jump up Lions", youtubeUrl: "https://youtube.com/shorts/-f56QTl-ALM" },
      { name: "빅토리 라이온즈", youtubeUrl: "https://youtube.com/shorts/70gYQNo-PYA" },
      { name: "우리가 누구? 최~강 삼성", youtubeUrl: "https://youtube.com/shorts/x3IwNYUKNdU" },
    ]},
    { title: "후반 리드 상황, 승부처", songs: [
      { name: "승리를 위해", youtubeUrl: "https://youtube.com/shorts/BSYUPEI0-Lk" },
      { name: "승리하라 최강삼성", youtubeUrl: "https://youtube.com/shorts/wPCmipPG6W4" },
      { name: "승리의 그 이름", youtubeUrl: "https://youtube.com/shorts/svzt6bmCuJU" },
      { name: "승리의 라이온즈", youtubeUrl: "https://youtube.com/shorts/pffp5hjcx4c" },
    ]},
    { title: "상황별 응원", songs: [
      { name: "안타송1", youtubeUrl: "https://youtube.com/shorts/rtnSvRKtwrw" },
      { name: "안타송2", youtubeUrl: "https://youtube.com/shorts/RgtZzK6Ak6A" },
      { name: "볼넷송", youtubeUrl: "https://youtube.com/shorts/tTeJGg2uDA0" },
      { name: "풀카운트송", youtubeUrl: "https://youtube.com/shorts/ojOctBbbhPM" },
      { name: "견제구호", youtubeUrl: "https://youtube.com/shorts/x1PV1H72G9k" },
    ]},
  ],
  nc: [
    { title: "경기시작", songs: [
      { name: "라인업송", youtubeUrl: "https://youtu.be/oGoC8BKWHhQ" },
    ]},
    { title: "초반 분위기 올릴 때", songs: [
      { name: "다이노스 찬가", youtubeUrl: "https://youtube.com/shorts/8HJeLRCpPKg" },
      { name: "다이노스여 일어나라!", youtubeUrl: "https://youtube.com/shorts/vNzsaM6rZAk" },
      { name: "다이노스 다이겨쓰", youtubeUrl: "https://youtube.com/shorts/z2G1h8_J_wA" },
      { name: "창원의 NC", youtubeUrl: "https://youtube.com/shorts/6oa_JfcFFag" },
    ]},
    { title: "후반 리드 상황, 승부처", songs: [
      { name: "승리를 위하여", youtubeUrl: "https://youtube.com/shorts/bqZ5iXVLEHA" },
      { name: "승리의 깃발", youtubeUrl: "https://youtube.com/shorts/NQOlCg5GaNM" },
      { name: "승리의 함성", youtubeUrl: "https://youtube.com/shorts/49lvb6-Hmqo" },
      { name: "승리의 NC 질주의 다이노스", youtubeUrl: "https://youtube.com/shorts/yBQswlazbn4" },
    ]},
    { title: "상황별 응원", songs: [
      { name: "안타송1", youtubeUrl: "https://youtube.com/shorts/VMHLOJ5Dx8A" },
      { name: "안타송2", youtubeUrl: "https://youtube.com/shorts/gncVrqQL2QY" },
      { name: "안타송3", youtubeUrl: "https://youtube.com/shorts/VJgfiIDKuz0" },
      { name: "볼넷송", youtubeUrl: "https://youtube.com/shorts/-tb9UYlyYFc" },
      { name: "풀카운트송", youtubeUrl: "https://youtube.com/shorts/uWlHx0TCfO8" },
      { name: "견제구호", youtubeUrl: "https://youtube.com/shorts/eSEaA36HpgU" },
    ]},
  ],
  lotte: [
    { title: "경기시작", songs: [
      { name: "라인업송", youtubeUrl: "https://youtu.be/kBbnYfDccdw" },
    ]},
    { title: "초반 분위기 올릴 때", songs: [
      { name: "Dream of Ground", youtubeUrl: "https://youtube.com/shorts/x1wGEsGU-mc" },
      { name: "바닷새", youtubeUrl: "https://youtube.com/shorts/ce-9DNAvRUE" },
      { name: "뱃노래", youtubeUrl: "https://youtube.com/shorts/qrs9thqF2to" },
      { name: "승전가", youtubeUrl: "https://youtube.com/shorts/eWClBd2EJ7Q" },
      { name: "소리높여 외쳐보자", youtubeUrl: "https://youtube.com/shorts/0XowtYmvwY4" },
      { name: "힘차게 외쳐보자", youtubeUrl: "https://youtube.com/shorts/ufxiTwcGSuw" },
    ]},
    { title: "후반 리드 상황, 승부처", songs: [
      { name: "챔피언 롯데", youtubeUrl: "https://youtube.com/shorts/qBnhpB_zgNI" },
      { name: "승리를 외치자", youtubeUrl: "https://youtube.com/shorts/gbfQRhP2R8c" },
      { name: "오늘도 승리한다", youtubeUrl: "https://youtube.com/shorts/By8HO7gH5AQ" },
      { name: "승리는 누구", youtubeUrl: "https://youtube.com/shorts/pXYZnqCgCnI" },
    ]},
    { title: "상황별 응원", songs: [
      { name: "안타송1", youtubeUrl: "https://youtube.com/shorts/CBAygnAVHqw" },
      { name: "안타송2", youtubeUrl: "https://youtube.com/shorts/u-mxEGETByE" },
      { name: "안타송3", youtubeUrl: "https://youtube.com/shorts/UUrLz63U8LA" },
      { name: "볼넷송", youtubeUrl: "https://youtube.com/shorts/Wltt0imZ5zk" },
      { name: "풀카운트송", youtubeUrl: "https://youtube.com/shorts/ddkjew4Qs8Q" },
      { name: "견제구호", youtubeUrl: "https://youtube.com/shorts/4bvVzaNr-ps" },
    ]},
  ],
  kia: [
    { title: "경기시작", songs: [
      { name: "라인업송", youtubeUrl: "https://youtu.be/jQ8gF05Mr3I" },
    ]},
    { title: "초반 분위기 올릴 때", songs: [
      { name: "사랑한다 KIA", youtubeUrl: "https://youtube.com/shorts/UCXkT3vFzFY" },
      { name: "영원하리라 KIA 타이거즈", youtubeUrl: "https://youtube.com/shorts/y8gScmgVqmc" },
      { name: "버터플라이", youtubeUrl: "https://youtube.com/shorts/6g4aIJWyQIk" },
      { name: "최강 KIA를 위해", youtubeUrl: "https://youtube.com/shorts/pDBU4-DHuJM" },
      { name: "광주의 함성", youtubeUrl: "https://youtube.com/shorts/E22AmOLpb6E" },
      { name: "미치도록 사랑한다", youtubeUrl: "https://youtube.com/shorts/F4AV0cWw3sA" },
    ]},
    { title: "후반 리드 상황, 승부처", songs: [
      { name: "남행열차", youtubeUrl: "https://youtube.com/shorts/hyB-TBHym1A" },
      { name: "외쳐라 최강 KIA", youtubeUrl: "https://youtube.com/shorts/-_W1JRSMbVw" },
      { name: "KIA를 응원하라", youtubeUrl: "https://youtube.com/shorts/KWdXBFY8aQ4" },
      { name: "우리는 하나", youtubeUrl: "https://youtube.com/shorts/lpWEbweQ5xY" },
      { name: "열광하라 타이거즈", youtubeUrl: "https://youtube.com/shorts/X5wRnblpPTA" },
    ]},
    { title: "상황별 응원", songs: [
      { name: "안타송1", youtubeUrl: "https://youtube.com/shorts/iAPIpFGWJP0" },
      { name: "안타송2", youtubeUrl: "https://youtube.com/shorts/-ouN-1IJQzg" },
      { name: "안타송3", youtubeUrl: "https://youtube.com/shorts/ZpofNn1zCvI" },
      { name: "볼넷송", youtubeUrl: "https://youtube.com/shorts/Z_ClqUKkRQw" },
      { name: "풀카운트송", youtubeUrl: "https://youtube.com/shorts/aj5f_cYJwO8" },
      { name: "견제구호", youtubeUrl: "https://www.youtube.com/shorts/okCSYJSVvyA" },
    ]},
  ],
};

export const CHEER_PLAYERS: Record<string, PlayerCheer[]> = {
  doosan: [
    { name: "김재환" }, { name: "양의지" }, { name: "정수빈" },
    { name: "허경민" }, { name: "김재호" }, { name: "강승호" },
    { name: "박준영" }, { name: "조수행" }, { name: "이유찬" },
  ],
  lg: [
    { name: "김현수" }, { name: "오지환" }, { name: "문보경" },
    { name: "박해민" }, { name: "홍창기" }, { name: "문성주" },
    { name: "신민재" }, { name: "박동원" },
  ],
  kiwoom: [
    { name: "이정후" }, { name: "김혜성" }, { name: "송성문" },
    { name: "임지열" }, { name: "이주형" }, { name: "김휘집" },
  ],
  ssg: [
    { name: "추신수" }, { name: "최정" }, { name: "한유섬" },
    { name: "박성한" }, { name: "기예르모 에레디아" }, { name: "오태곤" },
    { name: "김성현" },
  ],
  kt: [
    { name: "강백호" }, { name: "황재균" }, { name: "박병호" },
    { name: "김상수" }, { name: "배정대" }, { name: "심우준" },
    { name: "멜 로하스 주니어" },
  ],
  samsung: [
    { name: "구자욱" }, { name: "김영웅" }, { name: "강민호" },
    { name: "이재현" }, { name: "김지찬" }, { name: "이성규" },
    { name: "맥 윌리엄슨" },
  ],
  nc: [
    { name: "박건우" }, { name: "손아섭" }, { name: "노진혁" },
    { name: "서호철" }, { name: "김주원" }, { name: "박민우" },
    { name: "권희동" }, { name: "맷 데이비슨" }, { name: "김형준" },
  ],
  lotte: [
    { name: "전준우" }, { name: "한동희" }, { name: "안치홍" },
    { name: "나승엽" }, { name: "윤동희" }, { name: "고승민" },
    { name: "손호영" }, { name: "유강남" }, { name: "레예스" },
    { name: "황성빈" },
  ],
  hanwha: [
    { name: "노시환" }, { name: "채은성" }, { name: "정은원" },
    { name: "하주석" }, { name: "황영묵" }, { name: "김태연" },
    { name: "문현빈" }, { name: "장진혁" },
  ],
  kia: [
    { name: "나성범" }, { name: "최형우" }, { name: "김도영" },
    { name: "소크라테스" }, { name: "박찬호" }, { name: "이우성" },
    { name: "김선빈" },
  ],
};
