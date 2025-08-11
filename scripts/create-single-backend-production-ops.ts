import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

// 랜덤 조회수 생성 함수
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createSingleProductionOpsPost() {
  const categoryId = 'cmdrfybll0002u8fseh2edmgf' // Backend 카테고리
  const authorId = 'cmdri2tj90000u8vgtyir9upy' // 관리자 사용자

  const title =
    'Spring Boot 프로덕션 운영 노하우: 5년차 개발자가 공유하는 실전 경험'
  const content = `# Spring Boot 프로덕션 운영 노하우: 5년차 개발자가 공유하는 실전 경험

## 🎯 들어가며: 진짜 프로덕션은 다르다

로컬에서 잘 돌아가던 애플리케이션이 프로덕션에서 터지는 경험, 다들 있으시죠? 5년간 여러 Spring Boot 애플리케이션을 프로덕션에서 운영하며 얻은 실전 노하우를 공유합니다. 이론이 아닌, 실제로 겪은 삽질과 해결 방법 위주로 정리했습니다.

## 🔥 프로덕션 환경 준비: 배포 전 체크리스트

### 1. 애플리케이션 설정 최적화

프로덕션 환경에서 가장 먼저 확인해야 할 것은 설정입니다. application-prod.yml을 제대로 구성하지 않으면 큰 화를 입습니다.

\`\`\`yaml
# application-prod.yml
spring:
  profiles:
    active: prod
  
  # JPA 설정 - 절대 create나 create-drop 사용 금지!
  jpa:
    hibernate:
      ddl-auto: validate  # 또는 none
    properties:
      hibernate:
        show_sql: false  # 로그 폭탄 방지
        format_sql: false
        jdbc:
          batch_size: 100  # 배치 처리 최적화
        session:
          events:
            log:
              LOG_QUERIES_SLOWER_THAN_MS: 3000  # 슬로우 쿼리 감지
  
  # 데이터베이스 커넥션 풀 설정
  datasource:
    hikari:
      maximum-pool-size: 20  # 서버 스펙에 따라 조정
      minimum-idle: 5
      connection-timeout: 20000
      idle-timeout: 300000
      max-lifetime: 1200000
      leak-detection-threshold: 60000  # 커넥션 리크 감지

# 로깅 설정
logging:
  level:
    root: INFO
    com.yourcompany: INFO
    org.springframework.web: WARN
    org.hibernate: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: /var/log/app/application.log
    max-size: 100MB
    max-history: 30
\`\`\`

### 2. JVM 튜닝: OutOfMemory를 방지하라

실제로 운영 중 OOM으로 고생한 경험이 많습니다. JVM 옵션은 신중하게 설정하세요.

\`\`\`bash
#!/bin/bash
# startup.sh - 프로덕션 실행 스크립트

JAVA_OPTS="-Xms2g -Xmx2g \\
  -XX:+UseG1GC \\
  -XX:MaxGCPauseMillis=200 \\
  -XX:+HeapDumpOnOutOfMemoryError \\
  -XX:HeapDumpPath=/var/log/app/heapdump.hprof \\
  -XX:+UseStringDeduplication \\
  -XX:+ParallelRefProcEnabled \\
  -Djava.security.egd=file:/dev/./urandom \\
  -Dspring.profiles.active=prod"

# 그레이스풀 셧다운을 위한 설정
java $JAVA_OPTS -jar application.jar &
PID=$!
echo $PID > app.pid

# 시그널 핸들러
trap "kill -TERM $PID" SIGTERM SIGINT
wait $PID
\`\`\`

## 📊 모니터링: 문제를 미리 발견하라

### Spring Boot Actuator 활용

Actuator는 프로덕션의 필수품입니다. 하지만 보안 설정을 잊으면 큰일납니다!

\`\`\`yaml
# Actuator 보안 설정
management:
  endpoints:
    web:
      base-path: /internal/actuator  # 경로 변경
      exposure:
        include: health,info,metrics,prometheus
        exclude: "*"  # 명시적으로 허용한 것만
  endpoint:
    health:
      show-details: when-authorized  # 인증된 사용자만
      probes:
        enabled: true  # K8s liveness/readiness probe
    metrics:
      enabled: true
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: \${spring.application.name}
      environment: prod
\`\`\`

### Custom Health Indicator

데이터베이스 외에도 중요한 외부 서비스의 상태를 체크하세요.

\`\`\`java
@Component
public class ExternalApiHealthIndicator implements HealthIndicator {
    
    private final RestTemplate restTemplate;
    
    @Override
    public Health health() {
        try {
            // 외부 API 헬스체크
            ResponseEntity<String> response = restTemplate.exchange(
                "https://api.external.com/health",
                HttpMethod.GET,
                null,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return Health.up()
                    .withDetail("api", "External API is responsive")
                    .build();
            }
            
            return Health.down()
                .withDetail("api", "External API returned " + response.getStatusCode())
                .build();
                
        } catch (Exception e) {
            return Health.down()
                .withDetail("api", "External API is not reachable")
                .withException(e)
                .build();
        }
    }
}
\`\`\`

## 🚨 에러 처리와 알림

### 중앙화된 에러 처리

프로덕션에서는 에러를 놓치면 안 됩니다. 모든 에러를 캐치하고 알림을 보내세요.

\`\`\`java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    private final SlackNotifier slackNotifier;
    private final ErrorMetrics errorMetrics;
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpectedException(
            Exception e, 
            HttpServletRequest request) {
        
        String errorId = UUID.randomUUID().toString();
        
        // 에러 로깅
        log.error("Unexpected error [{}] at {}: {}", 
            errorId, 
            request.getRequestURI(), 
            e.getMessage(), 
            e);
        
        // 메트릭 기록
        errorMetrics.incrementErrorCount(e.getClass().getSimpleName());
        
        // 심각한 에러는 즉시 알림
        if (isCriticalError(e)) {
            slackNotifier.notifyCriticalError(errorId, e, request);
        }
        
        // 사용자에게는 민감한 정보 숨기기
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse(
                errorId,
                "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
                LocalDateTime.now()
            ));
    }
    
    private boolean isCriticalError(Exception e) {
        return e instanceof DataAccessException ||
               e instanceof ConnectException ||
               e instanceof OutOfMemoryError;
    }
}
\`\`\`

## 🔄 무중단 배포 전략

### Blue-Green 배포 with Nginx

실제로 사용 중인 무중단 배포 스크립트입니다.

\`\`\`bash
#!/bin/bash
# deploy.sh - 무중단 배포 스크립트

CURRENT_PORT=$(cat /etc/nginx/service-port)
echo "현재 포트: $CURRENT_PORT"

if [ $CURRENT_PORT -eq 8081 ]; then
    NEW_PORT=8082
    OLD_PORT=8081
else
    NEW_PORT=8081
    OLD_PORT=8082
fi

echo "새로운 인스턴스 시작 (포트: $NEW_PORT)"
nohup java -jar -Dserver.port=$NEW_PORT app.jar > /dev/null 2>&1 &

# 헬스체크 대기
echo "헬스체크 대기중..."
for i in {1..30}; do
    response=$(curl -s http://localhost:$NEW_PORT/internal/actuator/health)
    if [[ "$response" == *"UP"* ]]; then
        echo "새 인스턴스 정상 작동 확인!"
        break
    fi
    echo "대기 중... ($i/30)"
    sleep 10
done

# Nginx 스위칭
echo "Nginx 설정 변경"
echo "set \\$service_port $NEW_PORT;" > /etc/nginx/service-port
nginx -s reload

# 이전 인스턴스 종료 (graceful)
echo "이전 인스턴스 종료 대기 (30초)"
sleep 30
kill $(lsof -t -i:$OLD_PORT)

echo "배포 완료!"
\`\`\`

## 💾 데이터베이스 최적화

### 슬로우 쿼리 모니터링

실제로 발견한 N+1 문제와 해결 방법입니다.

\`\`\`java
// ❌ N+1 문제 발생 코드
@Entity
public class Order {
    @OneToMany(mappedBy = "order")
    private List<OrderItem> items;
}

// 서비스에서
List<Order> orders = orderRepository.findAll();
orders.forEach(order -> {
    // 각 주문마다 추가 쿼리 발생!
    order.getItems().size();
});

// ✅ 해결 방법 1: Fetch Join
@Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items")
List<Order> findAllWithItems();

// ✅ 해결 방법 2: @EntityGraph
@EntityGraph(attributePaths = {"items"})
List<Order> findAll();

// ✅ 해결 방법 3: Batch Size 설정
@Entity
@BatchSize(size = 100)
public class OrderItem {
    // ...
}
\`\`\`

### 인덱스 전략

실제로 성능을 10배 개선한 인덱스 전략입니다.

\`\`\`sql
-- 자주 사용하는 검색 조건에 복합 인덱스
CREATE INDEX idx_order_status_created 
ON orders(status, created_at DESC);

-- 카디널리티가 높은 컬럼을 앞에
CREATE INDEX idx_user_email_status 
ON users(email, status);  -- email이 status보다 카디널리티 높음

-- 부분 인덱스로 공간 절약
CREATE INDEX idx_active_users 
ON users(created_at) 
WHERE status = 'ACTIVE';
\`\`\`

## 🔒 보안 강화

### API Rate Limiting

DDoS 공격을 막기 위한 Rate Limiting 구현입니다.

\`\`\`java
@Component
@Aspect
public class RateLimitAspect {
    
    private final RedisTemplate<String, String> redisTemplate;
    
    @Around("@annotation(rateLimit)")
    public Object rateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit) 
            throws Throwable {
        
        String key = getKey(joinPoint);
        Long count = redisTemplate.opsForValue().increment(key);
        
        if (count == 1) {
            redisTemplate.expire(key, rateLimit.period(), rateLimit.timeUnit());
        }
        
        if (count > rateLimit.limit()) {
            throw new RateLimitExceededException(
                "Rate limit exceeded. Try again later."
            );
        }
        
        return joinPoint.proceed();
    }
    
    private String getKey(ProceedingJoinPoint joinPoint) {
        HttpServletRequest request = getCurrentRequest();
        String ip = getClientIp(request);
        String method = joinPoint.getSignature().getName();
        return String.format("rate_limit:%s:%s", ip, method);
    }
}

// 사용 예시
@RestController
public class ApiController {
    
    @PostMapping("/api/expensive-operation")
    @RateLimit(limit = 10, period = 1, timeUnit = TimeUnit.MINUTES)
    public ResponseEntity<?> expensiveOperation() {
        // 비용이 큰 작업
    }
}
\`\`\`

## 📈 성능 최적화 실전 팁

### 1. 캐싱 전략

실제로 응답 시간을 90% 단축한 캐싱 전략입니다.

\`\`\`java
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration
            .defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeKeysWith(keySerializationPair())
            .serializeValuesWith(valueSerializationPair())
            .disableCachingNullValues();
        
        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .withCacheConfiguration("users", 
                config.entryTtl(Duration.ofHours(1)))
            .withCacheConfiguration("products", 
                config.entryTtl(Duration.ofMinutes(30)))
            .build();
    }
}

// 캐시 워밍업
@Component
public class CacheWarmer {
    
    @EventListener(ApplicationReadyEvent.class)
    public void warmUpCache() {
        log.info("캐시 워밍업 시작");
        
        // 자주 사용되는 데이터 미리 로드
        productService.getPopularProducts();
        categoryService.getAllCategories();
        
        log.info("캐시 워밍업 완료");
    }
}
\`\`\`

### 2. 비동기 처리

동기 처리로 인한 타임아웃을 해결한 방법입니다.

\`\`\`java
@Service
@Slf4j
public class NotificationService {
    
    @Async("notificationExecutor")
    public CompletableFuture<Void> sendEmailAsync(EmailRequest request) {
        try {
            // 시간이 오래 걸리는 이메일 발송
            emailClient.send(request);
            log.info("이메일 발송 완료: {}", request.getTo());
        } catch (Exception e) {
            log.error("이메일 발송 실패: {}", request.getTo(), e);
            // 실패한 요청은 큐에 저장해서 재시도
            retryQueue.add(request);
        }
        return CompletableFuture.completedFuture(null);
    }
}

@Configuration
public class AsyncConfig {
    
    @Bean("notificationExecutor")
    public Executor notificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("notification-");
        executor.setRejectedExecutionHandler(
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
        executor.initialize();
        return executor;
    }
}
\`\`\`

## 🚀 프로덕션 트러블슈팅

### 실제 겪은 문제들과 해결법

**1. 메모리 리크 문제**
- 증상: 서버가 며칠 후 OOM 발생
- 원인: @Scheduled 메서드에서 대량 데이터 처리 시 메모리 미해제
- 해결: 배치 처리 + 명시적 메모리 정리

**2. 커넥션 풀 고갈**
- 증상: "Unable to acquire JDBC Connection" 에러
- 원인: 트랜잭션 내에서 외부 API 호출로 인한 긴 대기시간
- 해결: 트랜잭션 범위 최소화 + 타임아웃 설정

**3. 로그 폭탄**
- 증상: 디스크 풀로 서버 다운
- 원인: 에러 발생 시 과도한 스택트레이스 로깅
- 해결: 로그 레벨 조정 + 로그 로테이션 설정

## 📚 프로덕션 운영 체크리스트

배포 전 반드시 확인해야 할 사항들:

✅ **설정 관련**
- [ ] 프로덕션 프로파일 설정 완료
- [ ] 민감한 정보 환경변수로 분리
- [ ] 로그 레벨 적절하게 설정
- [ ] 타임존 설정 확인

✅ **성능 관련**
- [ ] JVM 힙 메모리 설정
- [ ] 커넥션 풀 크기 최적화
- [ ] 캐시 설정 및 TTL 확인
- [ ] 인덱스 생성 확인

✅ **보안 관련**
- [ ] Actuator 엔드포인트 보안 설정
- [ ] CORS 설정 확인
- [ ] SQL Injection 방지 확인
- [ ] Rate Limiting 설정

✅ **모니터링 관련**
- [ ] 헬스체크 엔드포인트 동작 확인
- [ ] 메트릭 수집 설정
- [ ] 에러 알림 설정
- [ ] 로그 수집 파이프라인 구성

## 🎯 결론: 프로덕션은 준비가 90%다

프로덕션 운영은 개발과는 완전히 다른 게임입니다. 코드가 잘 돌아가는 것과 안정적으로 서비스를 운영하는 것은 별개의 문제죠. 

제가 5년간 겪은 수많은 장애와 삽질들이 이 글을 통해 여러분의 시간을 절약해드릴 수 있기를 바랍니다. 프로덕션은 항상 예상치 못한 일이 일어나지만, 충분한 준비와 모니터링으로 대부분의 문제를 예방할 수 있습니다.

무엇보다 중요한 것은 **실패를 두려워하지 말고, 실패에서 배우는 것**입니다. 장애는 언제든 일어날 수 있지만, 같은 실수를 반복하지 않는 것이 진짜 실력입니다.

Happy Production! 🚀

---

*이 글이 도움이 되셨다면 좋아요와 댓글로 여러분의 프로덕션 운영 경험을 공유해주세요!*`

  const excerpt =
    'Spring Boot 애플리케이션을 프로덕션에서 안정적으로 운영하기 위한 실전 노하우. 5년간의 경험을 바탕으로 모니터링, 배포, 트러블슈팅, 성능 최적화 방법을 상세히 공유합니다.'

  const slug = `spring-boot-production-operations-knowhow-${Date.now()}`

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
      {
        name: 'SpringBootOps',
        slug: 'springboot-ops',
        color: '#6db33f',
        description: null,
      },
      {
        name: '프로덕션',
        slug: 'production',
        color: '#ef4444',
        description: null,
      },
      {
        name: '모니터링',
        slug: 'monitoring',
        color: '#3b82f6',
        description: null,
      },
      {
        name: '운영노하우',
        slug: 'ops-knowhow',
        color: '#f59e0b',
        description: null,
      },
    ]

    for (const tagData of tags) {
      const tag = await prisma.mainTag.upsert({
        where: { slug: tagData.slug },
        update: { postCount: { increment: 1 } },
        create: {
          name: tagData.name,
          slug: tagData.slug,
          color: tagData.color,
          description: tagData.description,
          postCount: 1,
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
createSingleProductionOpsPost()
  .then(() => {
    console.log('🎉 프로덕션 운영 노하우 게시글 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 오류:', error)
    process.exit(1)
  })
