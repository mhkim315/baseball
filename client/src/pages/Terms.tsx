export default function Terms() {
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="md:hidden px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold">이용약관</h1>
        <p className="text-sm text-muted-foreground mt-0.5">fullcount.kr 커뮤니티 이용약관</p>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-2 md:mt-6">
        <div className="bg-card rounded-2xl border border-border p-5 text-sm leading-relaxed space-y-4 text-muted-foreground">
          <h2 className="text-base font-bold text-foreground">제1조 (목적)</h2>
          <p>본 약관은 fullcount.kr(이하 "서비스")이 제공하는 커뮤니티 게시판 및 직관 기록 서비스의 이용 조건과 절차, 회원과 서비스 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.</p>

          <h2 className="text-base font-bold text-foreground">제2조 (회원 가입)</h2>
          <p>① 회원은 소셜 로그인(Kakao, Naver, Google, Apple)을 통해 본 서비스에 가입할 수 있습니다.</p>
          <p>② 만 14세 미만의 회원 가입은 제한됩니다.</p>
          <p>③ 회원 가입 시 제공된 개인정보는 회원 본인의 식별 및 커뮤니티 기능 제공을 위해서만 사용됩니다.</p>

          <h2 className="text-base font-bold text-foreground">제3조 (커뮤니티 이용 규칙)</h2>
          <p>① 회원은 타인의 권리를 침해하거나 법령에 위반되는 내용을 게시할 수 없습니다.</p>
          <p>② 서비스는 다음 각 호에 해당하는 게시물을 사전 통보 없이 삭제할 수 있습니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>특정 개인을 식별할 수 있는 개인정보가 포함된 게시물</li>
            <li>타인을 모욕·비방하거나 허위 사실을 유포하는 게시물</li>
            <li>영리 목적의 광고·스팸성 게시물</li>
            <li>타인의 저작권 등 지식재산권을 침해하는 게시물</li>
          </ul>

          <h2 className="text-base font-bold text-foreground">제4조 (계정 삭제)</h2>
          <p>① 회원은 MY 페이지 또는 고객 지원을 통해 계정 삭제(회원 탈퇴)를 요청할 수 있습니다.</p>
          <p>② 계정 삭제 시 게시글과 댓글은 "탈퇴한 회원"으로 표시되며, 30일의 유예 기간 후 완전히 익명화됩니다.</p>
          <p>③ 유예 기간 중 재로그인 시 계정이 복구됩니다.</p>

          <h2 className="text-base font-bold text-foreground">제5조 (면책 조항)</h2>
          <p>① 서비스는 천재지변, 시스템 장애 등 불가항력적인 사유로 서비스가 중단될 경우 책임을 지지 않습니다.</p>
          <p>② 회원 간 또는 회원과 제3자 간의 분쟁은 해당 회원이 직접 해결하여야 합니다.</p>

          <h2 className="text-base font-bold text-foreground">제6조 (약관 개정)</h2>
          <p>본 약관은 관련 법령 변경, 서비스 정책 변경 등 필요 시 개정될 수 있으며, 개정 시 서비스 내 공지사항을 통해 사전 고지합니다.</p>

          <p className="text-xs pt-4">공포일: 2026년 5월 17일</p>
        </div>
      </div>
    </div>
  );
}
