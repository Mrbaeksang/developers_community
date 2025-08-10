export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-lg border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="mb-8 text-3xl font-black">개인정보처리방침</h1>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              1. 개인정보의 수집 항목 및 방법
            </h2>

            <h3 className="mb-2 font-bold">수집 항목</h3>
            <ul className="mb-4 list-inside list-disc space-y-1">
              <li>
                필수 항목: 이메일, 닉네임, OAuth 제공자 ID (Google, GitHub,
                Kakao)
              </li>
              <li>선택 항목: 프로필 이미지, 자기소개, 깃허브 주소</li>
              <li>
                자동 수집: IP 주소, 접속 시간, 브라우저 정보, 운영체제 정보
              </li>
            </ul>

            <h3 className="mb-2 font-bold">수집 방법</h3>
            <ul className="list-inside list-disc space-y-1">
              <li>OAuth 2.0 인증 (Google, GitHub, Kakao)</li>
              <li>회원가입 및 프로필 수정 시 직접 입력</li>
              <li>서비스 이용 과정에서 자동 수집</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              2. 개인정보의 이용 목적
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>회원 식별 및 인증</li>
              <li>커뮤니티 서비스 제공 (게시글 작성, 댓글, 좋아요 등)</li>
              <li>서비스 개선 및 신규 서비스 개발</li>
              <li>부정 이용 방지 및 법적 의무 준수</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              3. 개인정보의 보유 및 이용 기간
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>회원 정보: 회원 탈퇴 시까지</li>
              <li>게시글, 댓글: 작성자가 삭제할 때까지</li>
              <li>관계 법령에 따른 보관 의무가 있는 경우 해당 기간</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              4. 개인정보의 제3자 제공
            </h2>
            <p>
              Dev Community는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지
              않습니다.
            </p>
            <p className="mt-2">
              단, OAuth 인증 시 해당 서비스 제공자(Google, GitHub, Kakao)의
              개인정보처리방침이 적용됩니다.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              5. 개인정보의 파기
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>회원 탈퇴 요청 시 즉시 파기</li>
              <li>단, 관계 법령에 따라 보관이 필요한 경우 별도 보관</li>
              <li>파기 방법: 전자적 파일은 복구 불가능한 방법으로 삭제</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              6. 이용자의 권리와 행사 방법
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
            <p className="mt-2">
              위 권리 행사는 이메일(qortkdgus95@gmail.com)로 요청하실 수
              있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              7. 개인정보 보호책임자
            </h2>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="font-bold">개인정보 보호책임자</p>
              <p>이름: 백상현</p>
              <p>이메일: qortkdgus95@gmail.com</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              8. 개인정보처리방침 변경
            </h2>
            <p>이 개인정보처리방침은 2025년 7월 10일부터 적용됩니다.</p>
            <p className="mt-2">
              법령이나 서비스 변경사항을 반영하기 위해 개인정보처리방침을 변경할
              수 있으며, 변경 시 7일 전에 공지합니다.
            </p>
          </section>

          <div className="mt-12 border-t-2 border-black pt-6">
            <p className="text-sm text-gray-600">
              시행일: 2025년 7월 10일
              <br />
              최종 수정일: 2025년 7월 10일
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
