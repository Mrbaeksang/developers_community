import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

// 랜덤 조회수 생성 함수
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createSingleSpringBootJuniorPost() {
  const categoryId = 'cmdrfybll0002u8fseh2edmgf' // Backend 카테고리
  const authorId = 'cmdri2tj90000u8vgtyir9upy' // 관리자 사용자

  const title = 'Spring Boot 첫 걸음: 주니어 개발자가 꼭 알아야 할 핵심 개념'
  const content = `# Spring Boot 첫 걸음: 주니어 개발자가 꼭 알아야 할 핵심 개념

## 🌟 들어가며

Spring Boot를 처음 접하거나 이제 막 실무에 적용하기 시작한 주니어 개발자 여러분, 안녕하세요! 복잡해 보이는 Spring 생태계에서 길을 잃었다고 느끼시나요? 걱정하지 마세요. 이 글을 통해 Spring Boot의 핵심 개념을 차근차근 정리해드리겠습니다.

## 🎯 Spring Boot가 뭐길래 다들 쓰는 걸까?

### 설정 지옥에서의 탈출

예전 Spring Framework를 사용하던 시절을 아시나요? XML 파일로 가득한 설정 지옥이었죠. 하지만 Spring Boot는 "Convention over Configuration" 원칙으로 이 모든 고통을 해결했습니다. 

Spring Boot의 가장 큰 매력은 바로 **자동 설정(Auto-configuration)**입니다. 필요한 의존성만 추가하면 Spring Boot가 알아서 최적의 설정을 적용해줍니다. 데이터베이스 연결, 웹 서버 설정, 보안 설정 등 모든 것이 자동으로 이루어집니다.

## 🔧 DI/IoC: Spring의 심장을 이해하기

### 의존성 주입(Dependency Injection)이란?

의존성 주입은 Spring의 핵심입니다. 간단히 말해, 객체가 필요한 다른 객체를 직접 생성하지 않고 외부에서 주입받는 방식입니다. 

왜 이렇게 할까요? 코드의 결합도를 낮추고 테스트를 쉽게 만들기 위해서입니다. 실제 코드로 살펴볼까요?

\`\`\`java
// ❌ 의존성 주입을 사용하지 않은 경우
@Service
public class OrderService {
    private PaymentService paymentService = new PaymentService(); // 직접 생성
    
    public void processOrder(Order order) {
        paymentService.processPayment(order);
    }
}

// ✅ 의존성 주입을 사용한 경우
@Service
@RequiredArgsConstructor
public class OrderService {
    private final PaymentService paymentService; // 외부에서 주입
    
    public void processOrder(Order order) {
        paymentService.processPayment(order);
    }
}
\`\`\`

### IoC 컨테이너의 마법

제어의 역전(Inversion of Control)은 프로그램의 제어 흐름을 개발자가 아닌 프레임워크가 담당한다는 개념입니다. Spring의 IoC 컨테이너는 빈(Bean)의 생명주기를 관리하고, 필요한 곳에 자동으로 주입해줍니다.

주요 어노테이션들을 정리하면:
- **@Component**: 일반적인 컴포넌트 클래스
- **@Service**: 비즈니스 로직을 담당하는 서비스 클래스
- **@Repository**: 데이터 접근 계층(DAO) 클래스
- **@Controller**: 웹 요청을 처리하는 컨트롤러 클래스
- **@RestController**: RESTful API용 컨트롤러 (@Controller + @ResponseBody)

## 🚀 Auto-configuration의 비밀

### 스타터(Starter) 의존성의 힘

Spring Boot의 스타터는 정말 강력합니다. 예를 들어 웹 애플리케이션을 만들고 싶다면?

\`\`\`xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
\`\`\`

이 한 줄로 Tomcat 서버, Spring MVC, Jackson, Validation 등 웹 개발에 필요한 모든 것이 자동으로 설정됩니다!

### @SpringBootApplication의 3가지 역할

\`\`\`java
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
\`\`\`

이 간단한 어노테이션은 사실 3가지 중요한 어노테이션의 조합입니다:
1. **@Configuration**: 설정 클래스임을 명시
2. **@EnableAutoConfiguration**: 자동 설정 활성화
3. **@ComponentScan**: 컴포넌트 스캔 활성화

## 💻 Spring Boot DevTools: 개발 생산성 200% 향상

개발 중에 코드를 수정할 때마다 서버를 재시작하는 것, 정말 귀찮으시죠? DevTools가 해결해드립니다!

\`\`\`xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>
\`\`\`

DevTools의 주요 기능:
- **자동 재시작**: 클래스패스의 파일이 변경되면 자동으로 애플리케이션 재시작
- **LiveReload**: 정적 리소스 변경 시 브라우저 자동 새로고침
- **개발용 설정**: 캐시 비활성화 등 개발에 최적화된 설정
- **원격 디버깅**: 원격 서버의 애플리케이션 디버깅 지원

## 🧪 테스팅: 주니어도 할 수 있다!

### @SpringBootTest로 시작하기

Spring Boot는 테스트도 쉽게 만들어줍니다. 기본적인 통합 테스트는 이렇게 작성할 수 있습니다:

\`\`\`java
@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void 사용자_조회_테스트() throws Exception {
        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("홍길동"));
    }
}
\`\`\`

### 슬라이스 테스트로 속도 향상

전체 애플리케이션을 로드하는 @SpringBootTest는 느릴 수 있습니다. 특정 레이어만 테스트하려면 슬라이스 테스트를 사용하세요:

- **@WebMvcTest**: 컨트롤러 레이어 테스트
- **@DataJpaTest**: JPA 레포지토리 테스트
- **@RestClientTest**: REST 클라이언트 테스트
- **@JsonTest**: JSON 직렬화/역직렬화 테스트

## 📊 액추에이터(Actuator): 운영의 시작

프로덕션 환경에서 애플리케이션을 모니터링하는 것은 필수입니다. Spring Boot Actuator는 이를 위한 완벽한 도구입니다.

\`\`\`xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
\`\`\`

\`\`\`yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus
  endpoint:
    health:
      show-details: always
\`\`\`

주요 엔드포인트:
- **/actuator/health**: 애플리케이션 상태 확인
- **/actuator/metrics**: 각종 메트릭 정보
- **/actuator/info**: 애플리케이션 정보
- **/actuator/loggers**: 로거 레벨 동적 변경

## 🎨 프로파일(Profile) 활용하기

개발, 테스트, 운영 환경별로 다른 설정이 필요하다면? 프로파일을 사용하세요!

\`\`\`yaml
# application.yml
spring:
  profiles:
    active: dev

---
# 개발 환경
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: jdbc:h2:mem:testdb

---
# 운영 환경
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: jdbc:postgresql://prod-db:5432/myapp
\`\`\`

## 💡 주니어 개발자를 위한 실전 팁

### 1. 로깅을 제대로 활용하자

System.out.println() 대신 로거를 사용하세요:

\`\`\`java
@Slf4j
@Service
public class UserService {
    public User findUser(Long id) {
        log.debug("사용자 조회 시작: id={}", id);
        User user = userRepository.findById(id);
        log.info("사용자 조회 완료: {}", user);
        return user;
    }
}
\`\`\`

### 2. 예외 처리는 전역으로

@ControllerAdvice를 활용한 전역 예외 처리:

\`\`\`java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(e.getMessage()));
    }
}
\`\`\`

### 3. 설정은 외부화하자

민감한 정보는 절대 코드에 하드코딩하지 마세요. 환경변수나 외부 설정 파일을 활용하세요:

\`\`\`yaml
# application.yml
app:
  jwt:
    secret: \${JWT_SECRET:default-secret-key}
    expiration: \${JWT_EXPIRATION:86400}
\`\`\`

## 🚦 자주 만나는 실수와 해결법

### 1. 순환 참조 문제

두 개 이상의 빈이 서로를 참조하면 발생합니다. @Lazy 어노테이션이나 Setter 주입으로 해결할 수 있지만, 가장 좋은 방법은 설계를 다시 검토하는 것입니다.

### 2. N+1 문제

JPA 사용 시 자주 발생하는 성능 문제입니다. Fetch Join이나 @EntityGraph를 활용하세요.

### 3. 트랜잭션 롤백이 안 되는 문제

체크 예외는 기본적으로 롤백되지 않습니다. @Transactional(rollbackFor = Exception.class)로 명시하세요.

## 🎯 다음 단계로 나아가기

Spring Boot의 기초를 마스터했다면, 다음 주제들을 공부해보세요:

1. **Spring Security**: 인증과 인가
2. **Spring Data JPA**: 데이터베이스 연동 심화
3. **Spring Cloud**: 마이크로서비스 아키텍처
4. **Reactive Spring**: 비동기 논블로킹 프로그래밍
5. **Spring Batch**: 대용량 배치 처리

## 📚 추천 학습 리소스

- **공식 문서**: Spring Boot Reference Documentation (최고의 교과서!)
- **Baeldung**: 실전 예제가 풍부한 블로그
- **Spring Guides**: 공식 가이드 (15분 안에 하나씩 완성)
- **Josh Long의 Spring Tips**: YouTube에서 매주 업데이트되는 실전 팁

## 🎬 마무리

Spring Boot는 처음엔 복잡해 보일 수 있지만, 핵심 개념만 제대로 이해하면 정말 강력한 도구가 됩니다. DI/IoC를 이해하고, 자동 설정의 원리를 알고, 테스트를 작성하는 습관을 들이세요.

무엇보다 중요한 것은 꾸준한 연습입니다. 작은 프로젝트부터 시작해서 점점 복잡한 애플리케이션을 만들어보세요. 실수를 두려워하지 말고, 에러 메시지를 친구처럼 대하세요. 

Spring Boot와 함께라면 여러분도 곧 훌륭한 백엔드 개발자가 될 수 있습니다! 화이팅! 🚀

---

*이 글이 도움이 되셨다면 좋아요와 댓글로 여러분의 Spring Boot 학습 경험을 공유해주세요!*`

  const excerpt =
    'Spring Boot를 처음 시작하는 주니어 개발자를 위한 필수 가이드. DI/IoC, Auto-configuration, DevTools, 테스팅까지 실무에 바로 적용 가능한 핵심 개념을 친절하게 설명합니다.'

  const slug = 'spring-boot-essential-guide-for-junior-developers-2025'

  try {
    const post = await prisma.mainPost.create({
      data: {
        title,
        content,
        excerpt,
        slug,
        status: PostStatus.PUBLISHED,
        isPinned: false,
        authorId,
        authorRole: GlobalRole.ADMIN,
        categoryId,
        // 스키마 필드 완전 활용
        approvedAt: new Date(),
        approvedById: authorId,
        rejectedReason: null,
        metaTitle: title,
        metaDescription: excerpt,
        viewCount: getRandomViewCount(100, 250), // Backend 카테고리 조회수 범위
        likeCount: 0,
        commentCount: 0,
      },
    })

    // 관련 태그 생성 및 연결
    const tags = [
      { name: 'Spring Boot', slug: 'spring-boot', color: '#6db33f' },
      { name: 'Java', slug: 'java', color: '#007396' },
      { name: '주니어', slug: 'junior', color: '#10b981' },
      { name: '백엔드', slug: 'backend', color: '#8b5cf6' },
    ]

    for (const tagData of tags) {
      const tag = await prisma.mainTag.upsert({
        where: { slug: tagData.slug },
        update: { postCount: { increment: 1 } },
        create: {
          ...tagData,
          postCount: 1,
          description: null,
        },
      })

      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })
    }

    console.log(`✅ "${title}" 게시글이 성공적으로 생성되었습니다!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 슬러그: ${post.slug}`)
    console.log(`👁️ 조회수: ${post.viewCount}`)
    console.log(`🏷️ ${tags.length}개의 태그가 연결되었습니다.`)

    return post
  } catch (error) {
    console.error('게시글 생성 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
createSingleSpringBootJuniorPost()
  .then(() => {
    console.log('🎉 주니어 개발자용 Spring Boot 게시글 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 오류:', error)
    process.exit(1)
  })
