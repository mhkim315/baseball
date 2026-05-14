import type { CheerSong, CheerSection, PlayerCheer } from "@shared/types";

// cheering-songs.json 기반 더미 데이터
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
      { name: "승리를 위하여", youtubeUrl: "https://youtube.com/shorts/Uiby7yyUZ1g" },
    ]},
  ],
  lg: [
    { title: "경기시작", songs: [
      { name: "LG 트윈스 라인업송", youtubeUrl: "https://youtu.be/example1" },
    ]},
    { title: "초반 분위기", songs: [
      { name: "우리는 LG", youtubeUrl: "https://youtu.be/example2" },
      { name: "트윈스 파이팅", youtubeUrl: "https://youtu.be/example3" },
      { name: "LG 승리의 노래", youtubeUrl: "https://youtu.be/example4" },
    ]},
    { title: "승부처", songs: [
      { name: "LG 트윈스 승리하리라", youtubeUrl: "https://youtu.be/example5" },
      { name: "우리가 LG다", youtubeUrl: "https://youtu.be/example6" },
    ]},
  ],
  kiwoom: [
    { title: "경기시작", songs: [
      { name: "키움 히어로즈 라인업송", youtubeUrl: "https://youtu.be/example7" },
    ]},
    { title: "분위기 올릴 때", songs: [
      { name: "히어로즈 파이팅", youtubeUrl: "https://youtu.be/example8" },
      { name: "우리는 히어로즈", youtubeUrl: "https://youtu.be/example9" },
    ]},
  ],
  ssg: [
    { title: "경기시작", songs: [
      { name: "SSG 랜더스 라인업송", youtubeUrl: "https://youtu.be/example10" },
    ]},
    { title: "분위기 올릴 때", songs: [
      { name: "랜더스 파이팅", youtubeUrl: "https://youtu.be/example11" },
      { name: "인천의 자존심", youtubeUrl: "https://youtu.be/example12" },
    ]},
  ],
  kt: [
    { title: "경기시작", songs: [
      { name: "KT 위즈 라인업송", youtubeUrl: "https://youtu.be/example13" },
    ]},
    { title: "분위기 올릴 때", songs: [
      { name: "위즈 파이팅", youtubeUrl: "https://youtu.be/example14" },
      { name: "수원의 마법사", youtubeUrl: "https://youtu.be/example15" },
    ]},
  ],
  samsung: [
    { title: "경기시작", songs: [
      { name: "삼성 라이온즈 라인업송", youtubeUrl: "https://youtu.be/example16" },
    ]},
    { title: "분위기 올릴 때", songs: [
      { name: "라이온즈 파이팅", youtubeUrl: "https://youtu.be/example17" },
      { name: "대구의 사자", youtubeUrl: "https://youtu.be/example18" },
    ]},
  ],
  nc: [
    { title: "경기시작", songs: [
      { name: "NC 다이노스 라인업송", youtubeUrl: "https://youtu.be/example19" },
    ]},
    { title: "분위기 올릴 때", songs: [
      { name: "다이노스 파이팅", youtubeUrl: "https://youtu.be/example20" },
      { name: "창원의 공룡", youtubeUrl: "https://youtu.be/example21" },
    ]},
  ],
  lotte: [
    { title: "경기시작", songs: [
      { name: "롯데 자이언츠 라인업송", youtubeUrl: "https://youtu.be/example22" },
    ]},
    { title: "분위기 올릴 때", songs: [
      { name: "부산갈매기", youtubeUrl: "https://youtu.be/example23" },
      { name: "자이언츠 파이팅", youtubeUrl: "https://youtu.be/example24" },
    ]},
  ],
  hanwha: [
    { title: "경기시작", songs: [
      { name: "한화 이글스 라인업송", youtubeUrl: "https://youtu.be/example25" },
    ]},
    { title: "분위기 올릴 때", songs: [
      { name: "이글스 파이팅", youtubeUrl: "https://youtu.be/example26" },
      { name: "대전의 독수리", youtubeUrl: "https://youtu.be/example27" },
    ]},
  ],
  kia: [
    { title: "경기시작", songs: [
      { name: "KIA 타이거즈 라인업송", youtubeUrl: "https://youtu.be/example28" },
    ]},
    { title: "분위기 올릴 때", songs: [
      { name: "타이거즈 파이팅", youtubeUrl: "https://youtu.be/example29" },
      { name: "광주의 호랑이", youtubeUrl: "https://youtu.be/example30" },
    ]},
  ],
};

// cheering-players.json 기반 더미 데이터
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
    { name: "박성한" }, { name: "오태곤" }, { name: "김성현" },
  ],
  kt: [
    { name: "강백호" }, { name: "황재균" }, { name: "박병호" },
    { name: "김상수" }, { name: "배정대" }, { name: "심우준" },
  ],
  samsung: [
    { name: "구자욱" }, { name: "김영웅" }, { name: "강민호" },
    { name: "이재현" }, { name: "김지찬" },
  ],
  nc: [
    { name: "박건우" }, { name: "손아섭" }, { name: "노진혁" },
    { name: "서호철" }, { name: "김주원" },
  ],
  lotte: [
    { name: "전준우" }, { name: "한동희" }, { name: "안치홍" },
    { name: "나승엽" }, { name: "윤동희" },
  ],
  hanwha: [
    { name: "노시환" }, { name: "채은성" }, { name: "정은원" },
    { name: "하주석" }, { name: "황영묵" },
  ],
  kia: [
    { name: "나성범" }, { name: "최형우" }, { name: "김도영" },
    { name: "소크라테스" }, { name: "박찬호" },
  ],
};

import type { StandingRow } from "@shared/types";

export const KBO_STANDINGS: StandingRow[] = [
  { rank: 1, teamName: "KT", winRate: 0.657, wlt: "23승1무12패", gamesBehind: 0.0, streak: "1패" },
  { rank: 2, teamName: "LG", winRate: 0.611, wlt: "22승0무14패", gamesBehind: 1.5, streak: "2패" },
  { rank: 3, teamName: "삼성", winRate: 0.6, wlt: "21승1무14패", gamesBehind: 2.0, streak: "7승" },
  { rank: 4, teamName: "SSG", winRate: 0.543, wlt: "19승1무16패", gamesBehind: 4.0, streak: "2패" },
  { rank: 5, teamName: "KIA", winRate: 0.472, wlt: "17승1무19패", gamesBehind: 6.5, streak: "1패" },
  { rank: 5, teamName: "두산", winRate: 0.472, wlt: "17승1무19패", gamesBehind: 6.5, streak: "2승" },
  { rank: 7, teamName: "한화", winRate: 0.444, wlt: "16승0무20패", gamesBehind: 7.5, streak: "2승" },
  { rank: 8, teamName: "NC", winRate: 0.429, wlt: "15승1무20패", gamesBehind: 8.0, streak: "3패" },
  { rank: 9, teamName: "롯데", winRate: 0.412, wlt: "14승1무20패", gamesBehind: 8.5, streak: "1승" },
  { rank: 10, teamName: "키움", winRate: 0.361, wlt: "13승1무23패", gamesBehind: 10.5, streak: "1승" },
];

export { TEAM_NAME_TO_ID } from "@shared/constants";
