import { config } from "@/lib/config";

const BASE = config.baseUrl;

export default function Privacy() {
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="md:hidden px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold">개인정보처리방침</h1>
        <p className="text-sm text-muted-foreground mt-0.5">fullcount.kr 개인정보처리방침</p>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-2 md:mt-6">
        <div className="bg-card rounded-2xl border border-border p-5 text-sm leading-relaxed space-y-4 text-muted-foreground">
          <p>fullcount.kr(이하 "서비스")은 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법령에 따라 회원의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리하기 위해 다음과 같이 개인정보처리방침을 수립합니다.</p>

          <h2 className="text-base font-bold text-foreground">1. 수집하는 개인정보 항목</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>소셜 로그인 정보</strong>: 소셜 로그인 제공자로부터 제공받은 회원 식별자(ID), 닉네임</li>
            <li><strong>서비스 이용 정보</strong>: 게시글·댓글 작성 내역, 직관 기록, 응원팀 선택 정보</li>
            <li><strong>자동 수집 항목</strong>: 서비스 이용 기록, 접속 로그, 기기 정보(OS 버전, 기기 모델)</li>
          </ul>
          <p>서비스는 회원의 비밀번호, 주민등록번호, 금융정보 등 민감 정보를 수집하지 않습니다.</p>

          <h2 className="text-base font-bold text-foreground">2. 개인정보 수집 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 식별 및 커뮤니티 기능 제공 (게시글·댓글 작성, 프로필 관리)</li>
            <li>직관 기록 및 승률 통계 등 개인화 서비스 제공</li>
            <li>서비스 개선 및 장애 대응을 위한 로그 분석</li>
            <li>약관 위반 게시물 모니터링 및 서비스 운영</li>
          </ul>

          <h2 className="text-base font-bold text-foreground">3. 개인정보 보관 및 파기</h2>
          <p>① 회원의 개인정보는 회원 탈퇴 시까지 보관되며, 탈퇴 후 30일의 유예 기간을 거쳐 완전히 파기됩니다.</p>
          <p>② 유예 기간 중에는 계정 복구가 가능하며, 유예 기간 경과 후에는 모든 개인정보가 복구 불가능한 방법으로 안전하게 삭제됩니다.</p>
          <p>③ 다만, 관계 법령에 따라 다음 정보는 일정 기간 보관합니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>게시글·댓글: "탈퇴한 회원"으로 익명화하여 보관 (커뮤니티 게시물 유지 목적)</li>
            <li>서비스 이용 기록 (접속 로그): 3개월 (통신비밀보호법)</li>
          </ul>

          <h2 className="text-base font-bold text-foreground">4. 개인정보 제3자 제공</h2>
          <p>서비스는 회원의 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 따른 의무가 있거나 수사 기관의 적법한 요청이 있는 경우는 예외로 합니다.</p>

          <h2 className="text-base font-bold text-foreground">5. 개인정보 처리 위탁</h2>
          <p>서비스는 다음의 외부 서비스를 통해 인증 및 데이터 처리를 위탁하며, 위탁 시 개인정보가 안전하게 처리될 수 있도록 관련 법령을 준수합니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Kakao, Naver, Google, Apple — 소셜 로그인 인증 처리</li>
            <li>Oracle Cloud (서버 호스팅) — 데이터베이스 및 애플리케이션 운영</li>
          </ul>

          <h2 className="text-base font-bold text-foreground">6. 회원의 권리</h2>
          <p>① 회원은 언제든지 MY 페이지에서 자신의 개인정보를 조회·수정할 수 있습니다.</p>
          <p>② 회원은 MY 페이지에서 계정 삭제(회원 탈퇴)를 요청할 수 있으며, 서비스는 지체 없이 처리합니다.</p>
          <p>③ 회원은 데이터 내보내기 기능을 통해 자신의 게시글·댓글 데이터를 JSON 형식으로 다운로드할 수 있습니다.</p>

          <h2 className="text-base font-bold text-foreground">7. 개인정보 보호책임자</h2>
          <p>서비스의 개인정보 보호 관련 문의는 아래 연락처로 접수해 주시기 바랍니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>이메일: support@fullcount.kr</li>
          </ul>

          <h2 className="text-base font-bold text-foreground">8. 방침 변경</h2>
          <p>본 개인정보처리방침은 법률 변경이나 서비스 정책 변경에 따라 개정될 수 있으며, 개정 시 서비스 내 공지사항을 통해 사전 고지합니다.</p>

          <p className="text-xs pt-4">공포일: 2026년 5월 17일</p>
        </div>
      </div>
    </div>
  );
}
