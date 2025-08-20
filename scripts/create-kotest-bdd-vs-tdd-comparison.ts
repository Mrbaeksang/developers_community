import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

// Backend 카테고리 ID
const BACKEND_CATEGORY_ID = 'cmdrfybll0002u8fseh2edmgf'

// 랜덤 조회수 생성
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 🎯 Kotest BDD vs TDD 완전 정복: 코틀린 스프링부트 테스팅 마스터 가이드

## 🎯 한 줄 요약
**BehaviorSpec vs FunSpec vs JUnit? 코틀린 스프링부트에서 BDD와 TDD 스타일 테스팅을 완벽하게 비교분석하고 실전 적용법까지 한 번에 정리했습니다!**

![Kotest 메인 이미지](https://velog.velcdn.com/images/pak4184/post/6936c24b-58a2-4e2b-8580-e333dea83d31/image.png)

## 🤔 테스팅 스타일 선택의 고민

코틀린 스프링부트 프로젝트를 시작할 때 이런 고민 해보셨나요?

- **"Kotest BehaviorSpec이 BDD라는데, TDD는 뭘로 해야 하지?"**
- **"JUnit 5 vs Kotest, 어떤 걸 선택해야 할까?"**
- **"Given-When-Then vs Test 함수, 언제 뭘 써야 할까?"**

**오늘 이 모든 고민을 완전히 해결해드리겠습니다!** 🔥

![BDD vs TDD 차이점](https://media.geeksforgeeks.org/wp-content/uploads/20240712134442/Difference-between-BDD-vs-TDD-(2).png)

## 📚 BDD vs TDD: 개념부터 정리하자

### 🎯 TDD (Test-Driven Development)
**"실패하는 테스트를 먼저 작성하고, 최소한의 코드로 통과시킨 후 리팩토링"**

**TDD 3단계 사이클:**
1. **Red**: 실패하는 테스트 작성
2. **Green**: 테스트를 통과하는 최소 코드 작성
3. **Refactor**: 코드 개선

### 🎯 BDD (Behavior-Driven Development)
**"비즈니스 요구사항을 자연어에 가까운 형태로 테스트 시나리오 작성"**

**BDD Given-When-Then 패턴:**
- **Given**: 주어진 상황 (전제조건)
- **When**: 특정 동작을 실행했을 때
- **Then**: 예상되는 결과

## 🔍 코틀린에서의 BDD vs TDD 구현 방식

### 1️⃣ BDD 스타일: Kotest BehaviorSpec


**BDD는 비즈니스 요구사항을 중심으로 한 행동 검증입니다:**

\`\`\`kotlin
// BDD 스타일: BehaviorSpec (자연어에 가까운 형태)
class UserServiceBehaviorTest : BehaviorSpec({
    
    Given("신규 사용자 정보가 주어졌을 때") {
        val userService = UserService()
        val validUserRequest = CreateUserRequest(
            username = "kimkotlin",
            email = "kim@kotlin.com",
            password = "password123"
        )
        
        When("사용자 생성을 요청하면") {
            val createdUser = userService.createUser(validUserRequest)
            
            Then("사용자가 성공적으로 생성된다") {
                createdUser.id shouldBeGreaterThan 0
                createdUser.username shouldBe "kimkotlin"
                createdUser.email shouldBe "kim@kotlin.com"
            }
            
            Then("패스워드는 암호화되어 저장된다") {
                createdUser.password shouldNotBe "password123"
                createdUser.password shouldStartWith "\$2a\$"
            }
        }
        
        When("중복된 이메일로 사용자 생성을 시도하면") {
            userService.createUser(validUserRequest) // 첫 번째 생성
            
            Then("DuplicateEmailException이 발생한다") {
                shouldThrow<DuplicateEmailException> {
                    userService.createUser(validUserRequest) // 중복 시도
                }
            }
        }
    }
    
    Given("기존 사용자가 존재할 때") {
        val userService = UserService()
        val existingUser = userService.createUser(
            CreateUserRequest("existing", "existing@test.com", "pass")
        )
        
        When("유효한 ID로 사용자를 조회하면") {
            val foundUser = userService.findById(existingUser.id)
            
            Then("해당 사용자 정보를 반환한다") {
                foundUser shouldNotBe null
                foundUser!!.username shouldBe "existing"
            }
        }
        
        When("존재하지 않는 ID로 조회하면") {
            Then("UserNotFoundException이 발생한다") {
                shouldThrow<UserNotFoundException> {
                    userService.findById(999L)
                }
            }
        }
    }
})
\`\`\`

### 2️⃣ TDD 스타일: Kotest FunSpec / JUnit


**TDD는 기능 단위의 빠른 검증에 적합합니다:**

#### A. Kotest FunSpec (코틀린 네이티브)
\`\`\`kotlin
class UserServiceFunTest : FunSpec({
    
    // Red → Green → Refactor 사이클에 적합
    test("사용자 생성 성공 테스트") {
        // Arrange
        val userService = UserService()
        val request = CreateUserRequest("test", "test@example.com", "password")
        
        // Act
        val result = userService.createUser(request)
        
        // Assert
        result.id shouldBeGreaterThan 0
        result.username shouldBe "test"
        result.email shouldBe "test@example.com"
    }
    
    test("중복 이메일 검증 테스트") {
        val userService = UserService()
        val request = CreateUserRequest("test", "test@example.com", "password")
        
        // 첫 번째 사용자 생성
        userService.createUser(request)
        
        // 중복 시도 시 예외 발생 검증
        shouldThrow<DuplicateEmailException> {
            userService.createUser(request)
        }
    }
    
    test("사용자 조회 테스트") {
        val userService = UserService()
        val created = userService.createUser(
            CreateUserRequest("lookup", "lookup@test.com", "pass")
        )
        
        val found = userService.findById(created.id)
        
        found shouldNotBe null
        found!!.username shouldBe "lookup"
    }
    
    test("존재하지 않는 사용자 조회 예외 테스트") {
        val userService = UserService()
        
        shouldThrow<UserNotFoundException> {
            userService.findById(999L)
        }
    }
})
\`\`\`

#### B. JUnit 5 (전통적 방식)
\`\`\`kotlin
@ExtendWith(SpringExtension::class)
@SpringBootTest
class UserServiceJUnitTest {
    
    @Autowired
    private lateinit var userService: UserService
    
    @Test
    @DisplayName("사용자 생성 성공")
    fun \`should create user successfully\`() {
        // Arrange
        val request = CreateUserRequest("junit", "junit@test.com", "password")
        
        // Act
        val result = userService.createUser(request)
        
        // Assert
        assertThat(result.id).isGreaterThan(0)
        assertThat(result.username).isEqualTo("junit")
        assertThat(result.email).isEqualTo("junit@test.com")
    }
    
    @Test
    @DisplayName("중복 이메일 예외")
    fun \`should throw exception for duplicate email\`() {
        val request = CreateUserRequest("duplicate", "dup@test.com", "pass")
        userService.createUser(request)
        
        assertThrows<DuplicateEmailException> {
            userService.createUser(request)
        }
    }
}
\`\`\`

## ⚔️ 스타일별 심화 비교 분석

### 📊 특징 비교표

| 구분 | BDD (BehaviorSpec) | TDD (FunSpec) | TDD (JUnit 5) |
|------|-------------------|---------------|--------------|
| **가독성** | ⭐⭐⭐⭐⭐ (자연어) | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **작성 속도** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **유지보수** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **협업 친화성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **러닝 커브** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

### 🎯 언제 어떤 스타일을 사용해야 할까?

#### ✅ BDD (BehaviorSpec) 사용 시기:
- **비즈니스 로직이 복잡한 서비스**
- **PM, QA와 협업이 중요한 프로젝트**
- **사용자 시나리오 기반 테스트**
- **인수 테스트 (Acceptance Test)**

\`\`\`kotlin
// 예시: 주문 처리 시스템
Given("장바구니에 상품이 담겨있고 결제수단이 등록된 상태에서") {
    When("주문을 요청하면") {
        Then("주문이 생성되고") {
        And("재고가 차감되고") {
        And("결제가 진행되어야 한다") {
    }
}
\`\`\`

#### ✅ TDD (FunSpec/JUnit) 사용 시기:
- **단위 테스트 (Unit Test)**
- **빠른 피드백이 필요한 개발**
- **알고리즘, 유틸리티 함수 테스트**
- **Red-Green-Refactor 사이클**

\`\`\`kotlin
test("암호화 함수 검증") {
    val plainText = "password123"
    val encrypted = encrypt(plainText)
    
    encrypted shouldNotBe plainText
    decrypt(encrypted) shouldBe plainText
}
\`\`\`

## 🚀 Spring Boot 통합 실전 가이드

### 1️⃣ 의존성 설정

\`\`\`gradle
dependencies {
    // Kotest
    testImplementation("io.kotest:kotest-runner-junit5:5.8.0")
    testImplementation("io.kotest:kotest-assertions-core:5.8.0")
    testImplementation("io.kotest:kotest-extensions-spring:1.1.3")
    
    // Spring Boot Test
    testImplementation("org.springframework.boot:spring-boot-starter-test") {
        exclude(group = "org.mockito", module = "mockito-core")
    }
    
    // MockK (Mockito 대신)
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("com.ninja-squad:springmockk:4.0.2")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
\`\`\`

### 2️⃣ 실제 Spring Boot 컨트롤러 테스트

#### BDD 스타일: API 시나리오 테스트
\`\`\`kotlin
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class UserControllerBehaviorTest : BehaviorSpec() {
    
    @Autowired
    private lateinit var testRestTemplate: TestRestTemplate
    
    init {
        Given("사용자 API 엔드포인트가 준비된 상태에서") {
            
            When("유효한 사용자 생성 요청을 보내면") {
                val request = CreateUserRequest(
                    username = "apitester",
                    email = "api@test.com",
                    password = "secure123"
                )
                
                val response = testRestTemplate.postForEntity(
                    "/api/users", 
                    request, 
                    UserResponse::class.java
                )
                
                Then("201 Created 응답을 받는다") {
                    response.statusCode shouldBe HttpStatus.CREATED
                }
                
                Then("생성된 사용자 정보를 반환한다") {
                    val userResponse = response.body!!
                    userResponse.username shouldBe "apitester"
                    userResponse.email shouldBe "api@test.com"
                    userResponse.id shouldBeGreaterThan 0
                }
            }
            
            When("잘못된 이메일 형식으로 요청하면") {
                val invalidRequest = CreateUserRequest(
                    username = "invalid",
                    email = "not-an-email",
                    password = "pass"
                )
                
                val response = testRestTemplate.postForEntity(
                    "/api/users", 
                    invalidRequest, 
                    ErrorResponse::class.java
                )
                
                Then("400 Bad Request 응답을 받는다") {
                    response.statusCode shouldBe HttpStatus.BAD_REQUEST
                }
                
                Then("검증 오류 메시지를 포함한다") {
                    response.body!!.message should include("이메일 형식")
                }
            }
        }
    }
}
\`\`\`

#### TDD 스타일: 서비스 레이어 단위 테스트
\`\`\`kotlin
@ExtendWith(SpringExtension::class)
class UserServiceUnitTest : FunSpec() {
    
    private val userRepository = mockk<UserRepository>()
    private val passwordEncoder = mockk<PasswordEncoder>()
    private val userService = UserService(userRepository, passwordEncoder)
    
    init {
        test("사용자 생성 시 패스워드 암호화 확인") {
            // Given
            val plainPassword = "password123"
            val encodedPassword = "\$2a\$10\$encoded"
            val request = CreateUserRequest("user", "user@test.com", plainPassword)
            
            every { userRepository.existsByEmail(any()) } returns false
            every { passwordEncoder.encode(plainPassword) } returns encodedPassword
            every { userRepository.save(any()) } returns User(
                id = 1L,
                username = "user",
                email = "user@test.com",
                password = encodedPassword
            )
            
            // When
            val result = userService.createUser(request)
            
            // Then
            result.password shouldBe encodedPassword
            verify { passwordEncoder.encode(plainPassword) }
            verify { userRepository.save(any()) }
        }
        
        test("이메일 중복 시 예외 발생") {
            // Given
            every { userRepository.existsByEmail("dup@test.com") } returns true
            
            // When & Then
            shouldThrow<DuplicateEmailException> {
                userService.createUser(
                    CreateUserRequest("dup", "dup@test.com", "pass")
                )
            }
            
            verify(exactly = 0) { userRepository.save(any()) }
        }
    }
}
\`\`\`

### 3️⃣ 데이터베이스 통합 테스트

#### BDD 스타일: Repository 행동 검증
\`\`\`kotlin
@DataJpaTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class UserRepositoryBehaviorTest : BehaviorSpec() {
    
    @Autowired
    private lateinit var userRepository: UserRepository
    
    @Autowired
    private lateinit var testEntityManager: TestEntityManager
    
    init {
        Given("사용자 데이터가 저장되어 있을 때") {
            val user1 = User(username = "active1", email = "active1@test.com", status = "ACTIVE")
            val user2 = User(username = "inactive1", email = "inactive1@test.com", status = "INACTIVE")
            val user3 = User(username = "active2", email = "active2@test.com", status = "ACTIVE")
            
            testEntityManager.persistAndFlush(user1)
            testEntityManager.persistAndFlush(user2)
            testEntityManager.persistAndFlush(user3)
            
            When("활성 사용자만 조회하면") {
                val activeUsers = userRepository.findByStatus("ACTIVE")
                
                Then("활성 상태 사용자 2명이 조회된다") {
                    activeUsers.size shouldBe 2
                    activeUsers.all { it.status == "ACTIVE" } shouldBe true
                }
            }
            
            When("이메일로 사용자를 검색하면") {
                val foundUser = userRepository.findByEmail("active1@test.com")
                
                Then("해당 사용자가 정확히 조회된다") {
                    foundUser shouldNotBe null
                    foundUser!!.username shouldBe "active1"
                }
            }
        }
    }
}
\`\`\`

## 🎪 고급 테스팅 패턴

### 1️⃣ 중첩 컨텍스트로 시나리오 구성

\`\`\`kotlin
class OrderServiceAdvancedTest : BehaviorSpec({
    
    Given("주문 시스템이 준비되어 있고") {
        val orderService = OrderService()
        
        context("충분한 재고가 있는 상품에 대해") {
            val productId = 1L
            val availableStock = 100
            
            When("10개 주문을 요청하면") {
                val order = orderService.createOrder(productId, quantity = 10)
                
                Then("주문이 성공한다") {
                    order.status shouldBe OrderStatus.CONFIRMED
                    order.quantity shouldBe 10
                }
                
                Then("재고가 차감된다") {
                    val remainingStock = stockService.getStock(productId)
                    remainingStock shouldBe (availableStock - 10)
                }
            }
            
            When("재고보다 많은 수량을 주문하면") {
                Then("재고 부족 예외가 발생한다") {
                    shouldThrow<InsufficientStockException> {
                        orderService.createOrder(productId, quantity = 200)
                    }
                }
            }
        }
        
        context("재고가 부족한 상품에 대해") {
            val lowStockProductId = 2L
            
            When("주문을 시도하면") {
                Then("즉시 재고 부족 예외가 발생한다") {
                    shouldThrow<InsufficientStockException> {
                        orderService.createOrder(lowStockProductId, quantity = 1)
                    }
                }
            }
        }
    }
})
\`\`\`

### 2️⃣ 프로퍼티 기반 테스팅 활용

\`\`\`kotlin
class ValidationTest : FunSpec({
    
    test("이메일 검증 로직의 견고성 테스트") {
        checkAll<String> { randomString ->
            val isValid = EmailValidator.isValid(randomString)
            
            if (isValid) {
                // 유효한 이메일이라면 @ 기호가 포함되어야 함
                randomString should contain("@")
                randomString shouldNot startWith("@")
                randomString shouldNot endWith("@")
            }
        }
    }
    
    test("패스워드 암호화 일관성 테스트") {
        checkAll(Gen.string().filter { it.isNotBlank() }) { password ->
            val encrypted1 = passwordEncoder.encode(password)
            val encrypted2 = passwordEncoder.encode(password)
            
            // 동일 비밀번호라도 매번 다른 해시값 생성
            encrypted1 shouldNotBe encrypted2
            
            // 하지만 검증은 둘 다 성공
            passwordEncoder.matches(password, encrypted1) shouldBe true
            passwordEncoder.matches(password, encrypted2) shouldBe true
        }
    }
})
\`\`\`

## ⚡ 실전 팁과 베스트 프랙티스

### 🎯 테스트 조직화 전략

#### 1. 패키지 구조
\`\`\`
src/test/kotlin/
├── behavior/           # BDD 테스트
│   ├── user/
│   ├── order/
│   └── payment/
├── unit/              # TDD 단위 테스트
│   ├── service/
│   ├── util/
│   └── validator/
└── integration/       # 통합 테스트
    ├── api/
    ├── repository/
    └── external/
\`\`\`

#### 2. 네이밍 컨벤션
\`\`\`kotlin
// BDD: 자연어에 가까운 설명
Given("사용자가 로그인되어 있고 권한이 있을 때")
When("게시글 삭제를 요청하면")
Then("게시글이 성공적으로 삭제된다")

// TDD: 기능 중심의 간결한 설명
test("유효한 토큰으로 인증 성공")
test("만료된 토큰으로 인증 실패")
test("잘못된 형식 토큰 검증 예외")
\`\`\`

### 🔥 성능 최적화 팁

#### 1. 테스트 병렬 실행
\`\`\`kotlin
// build.gradle.kts
tasks.test {
    systemProperty("kotest.framework.parallelism", "4")
    maxParallelForks = 4
}
\`\`\`

#### 2. 테스트 데이터 최적화
\`\`\`kotlin
// 테스트 전용 프로필 설정
@ActiveProfiles("test")
@TestPropertySource(
    properties = [
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.url=jdbc:h2:mem:testdb"
    ]
)
\`\`\`

## 🏢 실제 도입 사례와 마이그레이션

### 📊 기업 사례 분석

| 회사 | 이전 스택 | 현재 스택 | 마이그레이션 이유 |
|------|----------|----------|-----------------|
| **카카오뱅크** | JUnit + Mockito | Kotest + MockK | 코틀린 친화성, 가독성 향상 |
| **토스** | JUnit 혼합 | BDD/TDD 분리 | 비즈니스 로직 검증 강화 |
| **배달의민족** | JUnit 중심 | Kotest 점진 도입 | 개발 생산성 향상 |

### 🛠️ 단계별 마이그레이션 가이드

#### Phase 1: 신규 코드부터 시작
\`\`\`kotlin
// 기존 JUnit 테스트는 유지하면서
@Test
fun existingJUnitTest() {
    // 기존 테스트 그대로 유지
}

// 새로운 기능은 Kotest로
class NewFeatureTest : FunSpec({
    test("새로운 기능 테스트") {
        // Kotest 스타일로 작성
    }
})
\`\`\`

#### Phase 2: 중요 비즈니스 로직을 BDD로
\`\`\`kotlin
class PaymentProcessBehaviorTest : BehaviorSpec({
    Given("결제 가능한 상태의 주문이 있을 때") {
        When("신용카드로 결제를 시도하면") {
            Then("결제가 성공하고 주문 상태가 변경된다") {
                // 핵심 비즈니스 로직을 BDD로 명확하게 검증
            }
        }
    }
})
\`\`\`

#### Phase 3: 유틸리티와 단위 테스트를 TDD로
\`\`\`kotlin
class DateUtilTest : FunSpec({
    test("날짜 포매팅 정확성 검증") {
        // 빠른 피드백이 필요한 유틸리티 함수 테스트
    }
})
\`\`\`

## 📈 테스트 품질 측정과 개선

### 🎯 커버리지 vs 품질
\`\`\`kotlin
// ❌ 나쁜 예: 커버리지만 높은 테스트
test("모든 getter 호출") {
    val user = User("test", "test@test.com")
    user.username // 단순 호출
    user.email    // 의미 없는 테스트
}

// ✅ 좋은 예: 의미 있는 행동 검증
Given("사용자 정보가 주어졌을 때") {
    When("프로필 업데이트를 요청하면") {
        Then("변경된 정보가 정확히 반영된다") {
            // 실제 비즈니스 가치가 있는 검증
        }
    }
}
\`\`\`

### 📊 테스트 메트릭 추적
\`\`\`kotlin
// 테스트 실행 시간 모니터링
class PerformanceTest : FunSpec({
    test("API 응답시간 검증").config(timeout = 3.seconds) {
        val startTime = System.currentTimeMillis()
        
        val response = apiClient.getUserData()
        
        val endTime = System.currentTimeMillis()
        (endTime - startTime) shouldBeLessThan 1000
    }
})
\`\`\`

## 💭 마무리: 최적의 테스팅 전략 선택

**BDD와 TDD는 경쟁 관계가 아닌 상호 보완 관계입니다.**

### 🎯 권장 조합 전략:

#### 📋 프로젝트 초기:
- **핵심 비즈니스 로직**: BDD (BehaviorSpec)
- **유틸리티/헬퍼 함수**: TDD (FunSpec)
- **단위 테스트**: TDD (FunSpec 또는 JUnit)

#### 🏗️ 프로젝트 성장기:
- **사용자 시나리오**: BDD로 전환
- **성능 테스트**: TDD 유지
- **통합 테스트**: BDD/TDD 혼합

#### 🚀 대규모 운영:
- **인수 테스트**: BDD 중심
- **회귀 테스트**: TDD 중심
- **모니터링 테스트**: TDD 중심

**결국 팀의 상황과 프로젝트 특성에 맞게 유연하게 조합하는 것이 정답입니다!**

여러분의 프로젝트에서는 어떤 테스팅 전략을 선택하실 건가요? 댓글로 경험을 공유해주세요! 🎯

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️

### 🔗 참고 자료
- [Kotest 공식 문서](https://kotest.io/)
- [Spring Boot Test 가이드](https://spring.io/guides/gs/testing-web/)
- [MockK 문서](https://mockk.io/)
- [Kotlin Testing 베스트 프랙티스](https://kotlinlang.org/docs/jvm-test-using-junit.html)`

  try {
    console.log('🎯 Kotest BDD vs TDD 비교 게시글 생성 시작...')

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title:
          '🎯 Kotest BDD vs TDD 완전 정복: 코틀린 스프링부트 테스팅 마스터 가이드',
        slug: 'kotest-bdd-vs-tdd-kotlin-spring-boot-testing-guide',
        content,
        excerpt:
          'BehaviorSpec vs FunSpec vs JUnit? 코틀린 스프링부트에서 BDD와 TDD 스타일 테스팅을 완벽하게 비교분석하고 실전 적용법까지 한 번에 정리했습니다! Given-When-Then vs Test 함수 완전 정복!',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: BACKEND_CATEGORY_ID,
        viewCount: getRandomViewCount(200, 350),
        metaTitle:
          'Kotest BDD vs TDD 완전 가이드 - 코틀린 스프링부트 테스팅 마스터',
        metaDescription:
          'BehaviorSpec vs FunSpec 차이점과 실전 활용법 완벽 정리! 코틀린 스프링부트에서 BDD와 TDD 테스팅 스타일을 언제 어떻게 사용할지 실전 코드와 함께 마스터하세요.',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결 (색상 포함)
    const tagData = [
      { name: 'Kotest', color: '#8b5cf6' }, // 보라색 - 테스트 프레임워크
      { name: 'BDD', color: '#059669' }, // 녹색 - 행동 주도 개발
      { name: 'TDD', color: '#dc2626' }, // 빨간색 - 테스트 주도 개발
      { name: 'BehaviorSpec', color: '#059669' }, // 녹색 - BDD 스펙
      { name: 'FunSpec', color: '#dc2626' }, // 빨간색 - TDD 스펙
      { name: 'SpringBoot', color: '#059669' }, // 녹색 - Spring Boot
      { name: 'Kotlin', color: '#8b5cf6' }, // 보라색 - Kotlin 언어
      { name: '테스팅', color: '#f59e0b' }, // 황색 - 테스팅 일반
      { name: 'MockK', color: '#3b82f6' }, // 파란색 - 모킹 도구
      { name: 'JUnit대체', color: '#dc2626' }, // 빨간색 - JUnit 대체
    ]
    console.log('🏷️ 태그 처리 중...')

    for (const tagInfo of tagData) {
      let tag = await prisma.mainTag.findUnique({
        where: { name: tagInfo.name },
      })

      if (!tag) {
        tag = await prisma.mainTag.create({
          data: {
            name: tagInfo.name,
            slug: tagInfo.name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-'),
            color: tagInfo.color,
            postCount: 1,
          },
        })
      } else {
        await prisma.mainTag.update({
          where: { id: tag.id },
          data: {
            postCount: { increment: 1 },
            color: tagInfo.color, // 기존 태그도 색상 업데이트
          },
        })
      }

      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })
    }

    console.log(`🏷️ 태그 처리 완료: ${tagData.map((t) => t.name).join(', ')}`)

    // 사이트 통계 업데이트
    await prisma.siteStats.upsert({
      where: { id: 'main' },
      update: {
        totalPosts: { increment: 1 },
      },
      create: {
        id: 'main',
        totalUsers: 0,
        totalPosts: 1,
        totalComments: 0,
        totalCommunities: 0,
        dailyActiveUsers: 0,
      },
    })

    console.log('📈 사이트 통계 업데이트 완료')

    console.log('\n📸 사용된 이미지:')
    console.log(
      '1. Kotest 메인: https://velog.velcdn.com/images/pak4184/post/6936c24b-58a2-4e2b-8580-e333dea83d31/image.png'
    )
    console.log(
      '2. BDD vs TDD 차이점: https://media.geeksforgeeks.org/wp-content/uploads/20240712134442/Difference-between-BDD-vs-TDD-(2).png'
    )
  } catch (error) {
    console.error('❌ 게시글 생성 중 오류 발생:', error)
    throw error
  }
}

// 스크립트 실행
if (require.main === module) {
  createPost()
    .then(() => {
      console.log('🎉 Kotest BDD vs TDD 비교 게시글 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createPost }
