 🎯 브라우저 제어 도구

  1. browser_navigate

  - 용도: URL로 페이지 이동
  - 예시: browser_navigate(url="https://example.com")

  2. browser_navigate_back / browser_navigate_forward

  - 용도: 브라우저 뒤로가기/앞으로가기
  - 예시: 이전 페이지로 돌아가거나 다시 앞으로 이동

  3. browser_close

  - 용도: 브라우저 종료
  - 예시: 테스트 완료 후 브라우저 닫기

  4. browser_resize

  - 용도: 브라우저 창 크기 조절
  - 예시: browser_resize(width=1920, height=1080)

  📸 스크린샷 & 캡처

  5. browser_take_screenshot

  - 용도: 현재 페이지 스크린샷 촬영
  - 옵션:
    - fullPage: 전체 페이지 캡처
    - element: 특정 요소만 캡처
    - raw: PNG 형식으로 저장
  - 예시: browser_take_screenshot(fullPage=true, filename="test.png")

  6. browser_snapshot

  - 용도: 페이지의 접근성 트리 스냅샷 캡처 (DOM 구조 분석)
  - 예시: 페이지 구조와 요소들의 계층 확인

  🖱️ 상호작용 도구

  7. browser_click

  - 용도: 요소 클릭
  - 옵션: button (left/right/middle), doubleClick
  - 예시: browser_click(element="로그인 버튼", ref="e123")

  8. browser_type

  - 용도: 텍스트 입력
  - 옵션: slowly (한 글자씩), submit (Enter 키)
  - 예시: browser_type(element="검색창", text="테스트", submit=true)

  9. browser_press_key

  - 용도: 키보드 키 입력
  - 예시: browser_press_key(key="Enter"), browser_press_key(key="Escape")

  10. browser_hover

  - 용도: 마우스 호버
  - 예시: browser_hover(element="메뉴", ref="e456")

  11. browser_drag

  - 용도: 드래그 앤 드롭
  - 예시: browser_drag(startElement="소스", endElement="대상")

  12. browser_select_option

  - 용도: 드롭다운 선택
  - 예시: browser_select_option(element="국가 선택", values=["한국"])

  📁 파일 처리

  13. browser_file_upload

  - 용도: 파일 업로드
  - 예시: browser_file_upload(paths=["/path/to/file.jpg"])

  🗨️ 다이얼로그 처리

  14. browser_handle_dialog

  - 용도: alert, confirm, prompt 처리
  - 예시: browser_handle_dialog(accept=true, promptText="확인")

  📊 정보 수집

  15. browser_console_messages

  - 용도: 콘솔 메시지 가져오기
  - 예시: 에러, 경고, 로그 메시지 확인

  16. browser_network_requests

  - 용도: 네트워크 요청 기록 확인
  - 예시: API 호출, 리소스 로딩 확인

  17. browser_evaluate

  - 용도: JavaScript 코드 실행
  - 예시: browser_evaluate(function="() => document.title")

  🔖 탭 관리

  18. browser_tab_list

  - 용도: 열린 탭 목록 확인

  19. browser_tab_new

  - 용도: 새 탭 열기
  - 예시: browser_tab_new(url="https://example.com")

  20. browser_tab_select

  - 용도: 특정 탭으로 전환
  - 예시: browser_tab_select(index=1)

  21. browser_tab_close

  - 용도: 탭 닫기
  - 예시: browser_tab_close(index=2)

  ⏱️ 대기 & 동기화

  22. browser_wait_for

  - 용도: 특정 조건 대기
  - 옵션:
    - text: 텍스트 나타날 때까지 대기
    - textGone: 텍스트 사라질 때까지 대기
    - time: 지정 시간 대기
  - 예시: browser_wait_for(text="로딩 완료")

  🔧 설정 & 유틸리티

  23. browser_install