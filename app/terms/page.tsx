export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-lg border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="mb-8 text-3xl font-black">이용약관</h1>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="mb-3 text-xl font-bold text-black">제1조 (목적)</h2>
            <p>
              이 약관은 Dev Community(이하 &quot;서비스&quot;)가 제공하는 개발자
              커뮤니티 서비스의 이용과 관련하여 서비스와 이용자의 권리, 의무 및
              책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              제2조 (회원가입 및 이용)
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>
                OAuth 인증(Google, GitHub, Kakao)을 통해 회원가입이 가능합니다.
              </li>
              <li>1인 1계정을 원칙으로 합니다.</li>
              <li>타인의 정보를 도용하여 가입할 수 없습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              제3조 (서비스 이용 규칙)
            </h2>

            <h3 className="mb-2 font-bold">
              이용자는 다음 행위를 할 수 없습니다:
            </h3>
            <ul className="list-inside list-disc space-y-1">
              <li>스팸, 광고, 홍보물 게시</li>
              <li>욕설, 비방, 차별적 표현 사용</li>
              <li>타인의 개인정보 무단 수집 및 공개</li>
              <li>저작권 침해 콘텐츠 게시</li>
              <li>해킹, 악성코드 배포 등 시스템 침해 행위</li>
              <li>서비스 운영을 방해하는 행위</li>
              <li>법령에 위반되는 내용 게시</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              제4조 (게시물의 관리)
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>이용자가 작성한 게시물의 저작권은 작성자에게 있습니다.</li>
              <li>
                서비스는 게시물을 서비스 내에서 사용할 수 있는 권리를 가집니다.
              </li>
              <li>
                이용약관에 위반되는 게시물은 사전 통보 없이 삭제될 수 있습니다.
              </li>
              <li>메인 게시글은 관리자 승인 후 게시됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              제5조 (커뮤니티 운영)
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>사용자는 자유롭게 커뮤니티를 생성할 수 있습니다.</li>
              <li>
                커뮤니티 운영자는 해당 커뮤니티의 규칙을 정할 수 있습니다.
              </li>
              <li>
                불건전한 커뮤니티는 서비스 관리자에 의해 폐쇄될 수 있습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              제6조 (서비스 이용 제한)
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>
                이용약관 위반 시 경고, 일시정지, 영구정지 조치가 가능합니다.
              </li>
              <li>
                제재 조치에 대해 이의가 있는 경우 이메일로 문의할 수 있습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              제7조 (면책 조항)
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>서비스는 이용자 간 발생한 분쟁에 대해 책임지지 않습니다.</li>
              <li>
                서비스는 천재지변, 시스템 장애 등으로 인한 서비스 중단에 대해
                책임지지 않습니다.
              </li>
              <li>
                서비스는 이용자가 게시한 정보의 정확성을 보장하지 않습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">
              제8조 (약관의 변경)
            </h2>
            <p>
              서비스는 필요한 경우 약관을 변경할 수 있으며, 변경 시 7일 전에
              공지합니다.
            </p>
            <p className="mt-2">
              변경된 약관에 동의하지 않는 경우 회원 탈퇴를 요청할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-black">제9조 (문의)</h2>
            <div className="rounded-lg bg-gray-50 p-4">
              <p>서비스 이용 관련 문의사항은 아래로 연락 주시기 바랍니다.</p>
              <p className="mt-2 font-bold">이메일: qortkdgus95@gmail.com</p>
            </div>
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
