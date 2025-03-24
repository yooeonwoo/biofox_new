# UI 컴포넌트 디자인 시스템 가이드

현재 보유하고 있는 UI 컴포넌트와 디자인 가이드를 바탕으로 새로운 디자인 시스템을 정의합니다. 이 가이드는 다크 테마를 기반으로 하는 모던하고 세련된 UI를 구현하기 위한 통합 디자인 지침입니다. 추가로 제공된 컴포넌트와 `globals.css`를 참고하여 더욱 개선된 디자인 시스템을 제안합니다.

## 1. 디자인 컨셉 & 무드

### 전체 무드
- **베이스 테마**: 다크 그레이 계열 배경과 컨테이너
- **포인트 컬러**: 파스텔톤 핑크, 퍼플, 인디고, 바이올렛 그라데이션
- **애니메이션**: 부드럽고 미묘한 그라데이션과 애니메이션 효과
- **스타일**: 모던하고 미니멀한 디자인 + 고급스러운 유리 모피즘(Glass-morphism) 요소

### 사용성 & 계층구조
- 측면 **사이드바** 내비게이션
- 메인 콘텐츠 영역(차트, 카드, 그래프)
- 우측 패널 또는 모달/다이얼로그 시스템
- 암시적 계층구조 (그림자, 투명도, 블러 효과를 통해)

## 2. 컬러 가이드

### 기본 컬러 팔레트

| 이름 | Hex | 변수명 | 용도 |
|------|------|------|------|
| 배경색 | `#0a0a0a` | `--background` | 다크 모드 배경 |
| 전경색 | `#ededed` | `--foreground` | 다크 모드 텍스트 |
| 바이오폭스 퍼플 | `#6D28D9` | `--biofox-purple` | 주요 버튼, 강조 요소 |
| 바이오폭스 퍼플 라이트 | `#C0A6E3` | `--biofox-purple-light` | 보조 버튼, 경계선 |
| 오로라 핑크 | `#FF8AE2` | `--aurora-pink` | 그라데이션 시작, 강조 요소 |
| 오로라 바이올렛 | `#8B5CF6` | `--aurora-violet` | 그라데이션 중간, 차트 요소 |
| 오로라 블루 | `#67E8F9` | `--aurora-blue` | 그라데이션 끝, 상태 표시 |
| 아우라 실버 | `#D7D7D7` | `--aura-silver` | 라이트 모드 경계선 |
| 아우라 실버 다크 | `#BFC0C0` | `--aura-silver-dark` | 비활성화된 요소 |
| 다크 그레이 1 | `#383844` | `--dark-gray-1` | 다크 모드 카드 배경 |
| 다크 그레이 2 | `#2E3035` | `--dark-gray-2` | 다크 모드 입력 필드 배경 |

### CSS 변수 및 Tailwind 설정

```js
// globals.css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --biofox-purple: #6D28D9;
  --biofox-purple-light: #C0A6E3;
  --aura-silver: #D7D7D7;
  --aura-silver-dark: #BFC0C0;
  --aurora-pink: #FF8AE2;
  --aurora-violet: #8B5CF6;
  --aurora-blue: #67E8F9;
  --dark-gray-1: #383844;
  --dark-gray-2: #2E3035;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'background': 'var(--background)',
        'foreground': 'var(--foreground)',
        'biofox-purple': 'var(--biofox-purple)',
        'biofox-purple-light': 'var(--biofox-purple-light)',
        'aurora-pink': 'var(--aurora-pink)',
        'aurora-violet': 'var(--aurora-violet)',
        'aurora-blue': 'var(--aurora-blue)',
        'aura-silver': 'var(--aura-silver)',
        'aura-silver-dark': 'var(--aura-silver-dark)',
        'dark-gray-1': 'var(--dark-gray-1)',
        'dark-gray-2': 'var(--dark-gray-2)',
      },
    },
  },
};
```

## 3. 컴포넌트 변형 가이드

현재 보유 중인 UI 컴포넌트를 새로운 디자인 시스템에 맞게 조정하는 방법입니다.

### Alert

```tsx
// 어두운 테마를 위해 Alert 컴포넌트 변형
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground shadow-md",
  {
    variants: {
      variant: {
        default: "bg-dark-gray-2 text-white border-gray-700",
        destructive:
          "border-red-400/30 bg-red-900/20 text-red-400 dark:border-red-400/30 [&>svg]:text-red-400",
        success: 
          "border-green-400/30 bg-green-900/20 text-green-400 dark:border-green-400/30 [&>svg]:text-green-400",
        info:
          "border-purple-1/30 bg-purple-900/20 text-purple-1 dark:border-purple-1/30 [&>svg]:text-purple-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Badge

```tsx
// 어두운 테마를 위한 Badge 컴포넌트 변형
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-purple-2 text-white hover:bg-purple-2/80",
        secondary:
          "border-transparent bg-dark-gray-1 text-white hover:bg-dark-gray-1/80",
        destructive:
          "border-transparent bg-red-500/70 text-white hover:bg-red-500/50",
        outline: "text-white border-gray-700",
        success:
          "border-transparent bg-green-500/70 text-white hover:bg-green-500/50",
        pink:
          "border-transparent bg-pink-1 text-white hover:bg-pink-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Button

```tsx
// 새로운 컬러 팔레트와 그라데이션을 적용한 Button 컴포넌트
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-biofox-purple-light/50 focus-visible:ring-offset-1 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-biofox-purple text-white hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:shadow-lg hover:shadow-biofox-purple-light/20",
        gradient:
          "bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue text-white hover:shadow-lg hover:shadow-biofox-purple-light/30 hover:opacity-90",
        destructive:
          "bg-red-500/80 text-white hover:bg-red-500/60",
        outline:
          "border border-biofox-purple-light bg-transparent text-biofox-purple hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:text-white hover:border-transparent",
        secondary:
          "bg-dark-gray-1 text-white hover:bg-dark-gray-1/80",
        ghost:
          "text-white hover:bg-dark-gray-1/60",
        link: "text-aurora-violet underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// CSS 클래스를 활용한 버튼 (대안)
// globals.css에 정의된 클래스 사용
<button className="btn-primary">주요 버튼</button>
<button className="btn-secondary">보조 버튼</button>

```

### Card

```tsx
// 새로운 Card 컴포넌트 변형
<Card
  className="rounded-lg border border-biofox-purple-light/20 bg-dark-gray-1/90 text-foreground backdrop-blur-sm shadow-lg"
  {...props}
/>

<CardHeader
  className="flex flex-col space-y-1.5 p-6 text-foreground"
  {...props}
/>

<CardTitle
  className="text-xl font-semibold leading-none tracking-tight text-foreground"
  {...props}
/>

<CardDescription
  className="text-sm text-foreground/70"
  {...props}
/>

<CardContent
  className="p-6 pt-0 text-foreground"
  {...props}
/>

<CardFooter
  className="flex items-center p-6 pt-0 border-t border-biofox-purple-light/20"
  {...props}
/>

// 또는 globals.css에 정의된 클래스 사용
<div className="card">
  <h2 className="text-xl font-semibold">Card Title</h2>
  <p>Card content</p>
</div>

// 그라데이션 카드
<div className="card-gradient">
  <h2 className="text-xl font-semibold">Gradient Card</h2>
  <p>Card with gradient background</p>
</div>
```

### AuroraGradient 컴포넌트 활용

AuroraGradient 컴포넌트를 활용하여 다크 테마와 어울리는 애니메이션 배경을 만듭니다:

```tsx
// 배경에 활용
<AuroraGradient
  firstColor="139, 92, 246" // 보라색
  secondColor="244, 114, 182" // 핑크색
  thirdColor="147, 197, 253" // 하늘색
  blendingValue="soft-light"
  containerClassName="rounded-xl shadow-xl"
>
  <div className="relative z-10 p-6">
    {/* 카드 콘텐츠 */}
  </div>
</AuroraGradient>
```

### ModernGradientButton 활용

```tsx
<ModernGradientButton
  variant="primary"
  size="default"
  showIcon={true}
>
  새로운 회의
</ModernGradientButton>
```

## 4. 레이아웃 가이드

### 기본 레이아웃 구조

```tsx
<div className="flex h-screen bg-dark-gray-1 text-white">
  {/* 사이드바 */}
  <aside className="w-[80px] bg-dark-gray-1 border-r border-gray-700/50">
    {/* 사이드바 내용 */}
  </aside>
  
  {/* 메인 영역 */}
  <main className="flex-1 p-6 overflow-auto">
    {/* 메인 콘텐츠 */}
  </main>
  
  {/* 선택적: 우측 패널 */}
  <aside className="w-[300px] border-l border-gray-700/50 p-4 hidden lg:block">
    {/* 우측 패널 내용 */}
  </aside>
</div>
```

### 대시보드 레이아웃

```tsx
<div className="space-y-6">
  {/* 환영 배너 */}
  <div className="bg-gradient-to-r from-pink-1/20 to-purple-1/20 rounded-xl p-6 backdrop-blur-sm">
    <h1 className="text-2xl font-bold">안녕하세요, 김민수님!</h1>
    <p className="text-gray-300">오늘 5개의 일정이 있습니다. 모두 잘 진행 중입니다.</p>
  </div>
  
  {/* 주요 차트 */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="lg:col-span-2">
      {/* 차트 내용 */}
    </Card>
    <Card>
      {/* 사이드 정보 */}
    </Card>
  </div>
  
  {/* 하단 통계 카드 */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>월간 수입</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">₩23,249,000</div>
        <div className="text-green-400 flex items-center">+10.5% <ArrowUpIcon className="h-4 w-4 ml-1" /></div>
      </CardContent>
    </Card>
    {/* 추가 카드 */}
  </div>
</div>
```

## 5. 폰트 가이드

### 기본 폰트 설정

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'SF Pro Text', 
          'Pretendard Variable', 
          'Pretendard', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          'system-ui', 
          'Roboto', 
          'sans-serif'
        ],
      },
    },
  },
};
```

### 텍스트 크기 가이드

- 헤더(대제목): `text-2xl` (24px) ~ `text-3xl` (30px)
- 섹션 타이틀(중제목): `text-xl` (20px)
- 본문 텍스트: `text-base` (16px)
- 서브 텍스트: `text-sm` (14px)
- 작은 텍스트: `text-xs` (12px)

```tsx
<h1 className="text-2xl font-bold text-white">대시보드</h1>
<h2 className="text-xl font-semibold text-white">월간 통계</h2>
<p className="text-base text-gray-300">본문 텍스트 내용입니다.</p>
<span className="text-sm text-gray-400">추가 정보</span>
<div className="text-xs text-gray-500">마지막 업데이트: 3시간 전</div>
```

## 6. 인터랙션 & 애니메이션

### 호버 효과

버튼, 카드, 링크 등에 그라데이션 호버 효과를 적용합니다:

```tsx
<button className="px-4 py-2 bg-dark-gray-2 rounded-md border border-gray-700/50 text-white transition-all hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:border-transparent">
  버튼
</button>
```

또는 CSS 클래스를 사용합니다:

```html
<button class="btn-primary">그라데이션 버튼</button>
<button class="btn-secondary">보조 버튼</button>
```

### 애니메이션

globals.css에 미리 정의된 애니메이션 클래스를 활용합니다:

```tsx
{/* 아래에서 위로 나타나며 페이드인 */}
<div className="animate-appear delay-300">
  내용이 아래에서 위로 나타납니다.
</div>

{/* 확대되며 나타나는 효과 */}
<div className="animate-appear-zoom delay-500">
  내용이 확대되며 나타납니다.
</div>
```

딜레이 클래스를 사용하여 순차적인 애니메이션을 적용할 수 있습니다:
- `delay-100`: 0.1초 지연
- `delay-300`: 0.3초 지연
- `delay-500`: 0.5초 지연
- `delay-700`: 0.7초 지연
- `delay-1000`: 1초 지연

### 그라데이션 텍스트

GradientText 컴포넌트를 사용하여 강조 텍스트에 그라데이션을 적용합니다:

```tsx
<GradientText 
  colors={["#FF8AE2", "#8B5CF6", "#67E8F9"]} 
  size="xl" 
  weight="bold"
>
  Gradient Text Example
</GradientText>
```

### 애니메이션 설정 (tailwind.config.js)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s ease infinite',
        'appear': 'appear 0.5s ease-out forwards',
        'appear-zoom': 'appear-zoom 0.7s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        appear: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'appear-zoom': {
          'from': { opacity: '0', transform: 'scale(0.8)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
};
```

## 7. 아이콘 가이드

Lucide 아이콘을 활용한 일관된 아이콘 시스템:

```tsx
import { Home, BarChart2, Users, Settings, Bell } from 'lucide-react';

// 사이드바 아이콘 예시
<div className="flex flex-col items-center py-4">
  <Home className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors" />
  <BarChart2 className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors mt-6" />
  <Users className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors mt-6" />
  <Settings className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors mt-6" />
</div>

// 알림 아이콘 예시
<div className="relative">
  <Bell className="h-5 w-5 text-gray-300" />
  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-pink-1 flex items-center justify-center text-[10px] font-bold">
    3
  </span>
</div>
```

## 8. 반응형 디자인 가이드

### 반응형 브레이크포인트

- **sm**: 640px (작은 모바일)
- **md**: 768px (큰 모바일/작은 태블릿)
- **lg**: 1024px (태블릿/작은 노트북)
- **xl**: 1280px (노트북/데스크탑)
- **2xl**: 1536px (큰 데스크탑)

### 레이아웃 조정 예시

```tsx
// 반응형 그리드 예시
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* 그리드 아이템 */}
</div>

// 반응형 사이드바 예시
<aside className="fixed inset-y-0 left-0 w-20 md:w-64 bg-dark-gray-1 transform transition-transform duration-300 ease-in-out z-30
  -translate-x-full md:translate-x-0 ${isOpen ? 'translate-x-0' : ''}">
  {/* 사이드바 내용 */}
</aside>

// 모바일에서 숨기고 데스크탑에서만 표시
<div className="hidden lg:block">
  {/* 큰 화면에서만 보이는 콘텐츠 */}
</div>
```

## 9. 추가 컴포넌트 & 효과

### 그라데이션 텍스트

```tsx
import { GradientText } from "@/components/gradient-text";

<GradientText 
  colors={["#FF8AE2", "#8B5CF6", "#67E8F9"]} 
  size="2xl" 
  weight="bold"
  showBorder={true}
  animationSpeed={10}
>
  Welcome to Dashboard
</GradientText>
```

### 테두리 텍스트 (Outlined Text)

```tsx
import { OutlinedText } from "@/components/outlined-text";

<OutlinedText 
  text="Outlined Title" 
  textColor="white" 
  outlineColor="rgba(107, 33, 168, 0.8)" 
  fontSize="2rem" 
  fontWeight="bold" 
/>
```

### 에러 컴포넌트

```tsx
// 인라인 에러 메시지
import { ErrorMessage } from "@/components/error-message";

<ErrorMessage message="이메일 형식이 올바르지 않습니다." />

// 에러 토스트
import { ErrorToast } from "@/components/error-toast";

<ErrorToast 
  message="서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요." 
  onClose={() => console.log("Toast closed")} 
/>
```

### 유리 모피즘 카드

```tsx
<div className="rounded-xl bg-dark-gray-1/80 backdrop-blur-xl border border-biofox-purple-light/20 shadow-xl p-6">
  {/* 카드 내용 */}
</div>
```

### 발광 효과

```tsx
<div className="relative group">
  <div className="absolute -inset-1 bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue rounded-lg blur opacity-30 group-hover:opacity-70 transition-opacity"></div>
  <button className="relative bg-dark-gray-1 rounded-lg px-4 py-2 text-foreground">
    발광 효과 버튼
  </button>
</div>
```

## 10. 예시 구현

### 대시보드 헤더

```tsx
<header className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-white">안녕하세요, 김민수님!</h1>
    <p className="text-gray-400">오늘 5개의 일정이 있습니다. 7% 성공률로 잘 진행 중입니다.</p>
  </div>
  <ModernGradientButton variant="primary" showIcon={true}>
    새 미팅 생성
  </ModernGradientButton>
</header>
```

### 차트 카드

```tsx
<Card className="overflow-hidden">
  <CardHeader>
    <CardTitle>수익 트렌드</CardTitle>
    <CardDescription>최근 30일간의 수익 추이</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Recharts를 이용한 차트 */}
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="name" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: '#2E3035', 
          border: '1px solid #4b5563', 
          borderRadius: '8px',
          color: '#f9fafb'
        }} 
      />
      <Line type="monotone" dataKey="value" stroke="#ABA3F7" strokeWidth={2} dot={false} />
      <Area type="monotone" dataKey="value" fill="#ABA3F7" fillOpacity={0.2} />
    </LineChart>
  </CardContent>
</Card>
```

### 통계 카드

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card className="bg-dark-gray-2/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-gray-400">수익</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center">
        <div className="text-2xl font-bold">₩23,249,000</div>
        <div className="ml-2 text-green-400 flex items-center text-sm">
          <ArrowUpIcon className="h-4 w-4 mr-1" /> 10.5%
        </div>
      </div>
    </CardContent>
  </Card>
  
  <Card className="bg-dark-gray-2/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-gray-400">리드</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center">
        <div className="text-2xl font-bold">46</div>
        <div className="ml-2 text-green-400 flex items-center text-sm">
          <ArrowUpIcon className="h-4 w-4 mr-1" /> 3.5%
        </div>
      </div>
    </CardContent>
  </Card>
  
  <Card className="bg-dark-gray-2/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-gray-400">활동</CardTitle>
    </CardHeader>
    <CardContent>
      {/* 간단한 바 차트 */}
      <div className="flex items-end h-10 space-x-1">
        {[3, 5, 2, 7, 9, 4, 6].map((value, i) => (
          <div 
            key={i} 
            className="bg-purple-1 w-6 rounded-t-sm" 
            style={{ height: `${value * 10}%` }}
          ></div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span>토</span>
        <span>일</span>
      </div>
    </CardContent>
  </Card>
</div>
```

## 11. 접근성 고려사항

### 색상 대비
- 밝은 텍스트 색상(#FFFFFF)를 사용하여 어두운 배경에서도 텍스트가 잘 보이도록 조정
- 포인트 컬러는 충분한 대비를 갖도록 설정 (WCAG AA 기준 준수)

### 키보드 접근성
- 모든 상호작용 요소에 focus 스타일 지정
- Tab 순서 고려

### 애니메이션 감소
```tsx
// 사용자가 축소된 모션을 선호할 경우
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 12. globals.css 수정 가이드

기존 globals.css를 개선하여 새로운 디자인 시스템에 맞게 수정하는 방법을 제안합니다:

```css
@import "tailwindcss";

:root {
  /* 기본 색상 팔레트 (라이트 모드) */
  --background: #ffffff;
  --foreground: #171717;
  --biofox-purple: #6D28D9;
  --biofox-purple-light: #C0A6E3;
  --aura-silver: #D7D7D7;
  --aura-silver-dark: #BFC0C0;
  --aurora-pink: #FF8AE2;
  --aurora-violet: #8B5CF6;
  --aurora-blue: #67E8F9;
  --dark-gray-1: #383844;
  --dark-gray-2: #2E3035;
  
  /* 그라데이션 관련 변수 */
  --gradient-primary: linear-gradient(to right, var(--aurora-pink), var(--aurora-violet), var(--aurora-blue));
  --gradient-soft: linear-gradient(to right, rgba(255, 138, 226, 0.1), rgba(139, 92, 246, 0.1), rgba(103, 232, 249, 0.1));
  --shadow-glow: 0 0 15px rgba(192, 166, 227, 0.5);
  
  /* 컴포넌트 변수 */
  --card-border-radius: 0.5rem;
  --button-border-radius: 0.5rem;
  --input-border-radius: 0.375rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-noto-sans-kr), var(--font-inter), 'Pretendard', 'Noto Sans KR', Arial, sans-serif;
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

/* 커스텀 버튼 클래스 */
.btn-primary {
  background-color: var(--biofox-purple);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: var(--button-border-radius);
  font-weight: 600;
  transition: all 0.3s;
}

.btn-primary:hover {
  background-image: var(--gradient-primary);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

.btn-secondary {
  border: 1px solid var(--biofox-purple-light);
  color: var(--biofox-purple);
  padding: 0.5rem 1.5rem;
  border-radius: var(--button-border-radius);
  font-weight: 600;
  transition: all 0.3s;
  background-color: transparent;
}

.btn-secondary:hover {
  background-image: var(--gradient-primary);
  color: white;
  border-color: transparent;
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

/* 카드 스타일 */
.card {
  background-color: var(--dark-gray-1);
  color: var(--foreground);
  padding: 1.5rem;
  border-radius: var(--card-border-radius);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--biofox-purple-light);
  transition: all 0.3s;
}

.card:hover {
  box-shadow: var(--shadow-glow);
  border-color: var(--aurora-violet);
}

.card-gradient {
  background-color: var(--dark-gray-1);
  color: var(--foreground);
  padding: 1.5rem;
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-glow);
  border: 1px solid transparent;
  background-image: var(--gradient-soft);
  backdrop-filter: blur(8px);
}

/* 유틸리티 클래스 */
.text-gradient {
  background-image: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
}

/* 애니메이션 키프레임 */
@keyframes appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes appear-zoom {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 애니메이션 클래스 */
.animate-appear {
  animation: appear 0.5s ease-out forwards;
  opacity: 0;
}

.animate-appear-zoom {
  animation: appear-zoom 0.7s ease-out forwards;
  opacity: 0;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
}

/* 애니메이션 딜레이 */
.delay-100 { animation-delay: 0.1s; }
.delay-300 { animation-delay: 0.3s; }
.delay-500 { animation-delay: 0.5s; }
.delay-700 { animation-delay: 0.7s; }
.delay-1000 { animation-delay: 1s; }

/* 포커스 스타일 */
.focus-style:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--biofox-purple-light);
}

/* 글래스 모피즘 (Glass-morphism) 효과 */
.glass {
  background: rgba(56, 56, 68, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(192, 166, 227, 0.15);
  border-radius: var(--card-border-radius);
}

/* 그림자 효과 */
.shadow-glow {
  box-shadow: var(--shadow-glow);
}

.shadow-glow-hover:hover {
  box-shadow: var(--shadow-glow);
  transition: box-shadow 0.3s ease;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

/* 접근성 관련 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

## 13. 최종 구현 시 유의사항

1. **성능 최적화**
   - 복잡한 그라데이션과 애니메이션은 `will-change` 속성 활용
   - 불필요한 리렌더링 방지를 위해 컴포넌트 메모이제이션 고려
   - 큰 이미지나 무거운 그라데이션 효과는 레이지 로딩 적용

2. **테마 통합**
   - globals.css에 정의된 CSS 변수를 활용하여 테마 전환 구현
   - 다크/라이트 모드 전환 시 일관된 사용자 경험 제공
   - `next-themes` 라이브러리와 `ModernThemeSwitcher` 컴포넌트 활용

3. **컴포넌트 문서화**
   - Storybook 등을 활용하여 디자인 시스템 컴포넌트 문서화 고려
   - 각 컴포넌트의 사용 예시와 variants 명확히 문서화

4. **일관성 유지**
   - 프로젝트 전체에서 일관된 스타일 및 네이밍 컨벤션 유지
   - CSS 변수와 Tailwind 클래스를 혼합하여 사용할 때 일관성 유지
   - 컴포넌트 패턴 통일 (예: `variant`, `size` 속성 등)

5. **접근성 고려**
   - 색상 대비 WCAG 기준 준수 (특히 그라디언트 배경 위 텍스트)
   - 애니메이션 축소 옵션 제공 (`prefers-reduced-motion` 활용)
   - 모든 인터랙티브 요소에 키보드 포커스 스타일 적용

6. **반응형 디자인 검증**
   - 다양한 디바이스와 화면 크기에서 UI 컴포넌트 테스트
   - 모바일 퍼스트 접근 방식으로 작은 화면에서 큰 화면 순으로 최적화

7. **브라우저 호환성**
   - CSS 변수와 최신 CSS 기능의 브라우저 호환성 확인
   - 필요시 폴리필 또는 대체 스타일 제공
   - backdrop-filter와 같은 모던 CSS 속성에 대한 폴백(fallback) 제공

8. **애니메이션 과다 사용 피하기**
   - 같은 화면에 너무 많은 애니메이션 효과 사용 자제
   - 사용자 주의를 끌어야 하는 중요 요소에만 시각 효과 집중
   - 애니메이션 타이밍 및 이징(easing) 일관성 유지

이 가이드를 따라 디자인 시스템을 구현하면 일관되고 현대적인 UI를 만들 수 있습니다. 새로운 컴포넌트나 스타일을 추가할 때도 이 가이드라인을 참조하여 디자인 일관성을 유지하세요.# UI 컴포넌트 디자인 시스템 가이드

현재 보유하고 있는 UI 컴포넌트와 디자인 가이드를 바탕으로 새로운 디자인 시스템을 정의합니다. 이 가이드는 다크 테마를 기반으로 하는 모던하고 세련된 UI를 구현하기 위한 통합 디자인 지침입니다. 추가로 제공된 컴포넌트와 `globals.css`를 참고하여 더욱 개선된 디자인 시스템을 제안합니다.

## 1. 디자인 컨셉 & 무드

### 전체 무드
- **베이스 테마**: 다크 그레이 계열 배경과 컨테이너
- **포인트 컬러**: 파스텔톤 핑크, 퍼플, 인디고, 바이올렛 그라데이션
- **애니메이션**: 부드럽고 미묘한 그라데이션과 애니메이션 효과
- **스타일**: 모던하고 미니멀한 디자인 + 고급스러운 유리 모피즘(Glass-morphism) 요소

### 사용성 & 계층구조
- 측면 **사이드바** 내비게이션
- 메인 콘텐츠 영역(차트, 카드, 그래프)
- 우측 패널 또는 모달/다이얼로그 시스템
- 암시적 계층구조 (그림자, 투명도, 블러 효과를 통해)

## 2. 컬러 가이드

### 기본 컬러 팔레트

| 이름 | Hex | 변수명 | 용도 |
|------|------|------|------|
| 배경색 | `#0a0a0a` | `--background` | 다크 모드 배경 |
| 전경색 | `#ededed` | `--foreground` | 다크 모드 텍스트 |
| 바이오폭스 퍼플 | `#6D28D9` | `--biofox-purple` | 주요 버튼, 강조 요소 |
| 바이오폭스 퍼플 라이트 | `#C0A6E3` | `--biofox-purple-light` | 보조 버튼, 경계선 |
| 오로라 핑크 | `#FF8AE2` | `--aurora-pink` | 그라데이션 시작, 강조 요소 |
| 오로라 바이올렛 | `#8B5CF6` | `--aurora-violet` | 그라데이션 중간, 차트 요소 |
| 오로라 블루 | `#67E8F9` | `--aurora-blue` | 그라데이션 끝, 상태 표시 |
| 아우라 실버 | `#D7D7D7` | `--aura-silver` | 라이트 모드 경계선 |
| 아우라 실버 다크 | `#BFC0C0` | `--aura-silver-dark` | 비활성화된 요소 |
| 다크 그레이 1 | `#383844` | `--dark-gray-1` | 다크 모드 카드 배경 |
| 다크 그레이 2 | `#2E3035` | `--dark-gray-2` | 다크 모드 입력 필드 배경 |

### CSS 변수 및 Tailwind 설정

```js
// globals.css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --biofox-purple: #6D28D9;
  --biofox-purple-light: #C0A6E3;
  --aura-silver: #D7D7D7;
  --aura-silver-dark: #BFC0C0;
  --aurora-pink: #FF8AE2;
  --aurora-violet: #8B5CF6;
  --aurora-blue: #67E8F9;
  --dark-gray-1: #383844;
  --dark-gray-2: #2E3035;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'background': 'var(--background)',
        'foreground': 'var(--foreground)',
        'biofox-purple': 'var(--biofox-purple)',
        'biofox-purple-light': 'var(--biofox-purple-light)',
        'aurora-pink': 'var(--aurora-pink)',
        'aurora-violet': 'var(--aurora-violet)',
        'aurora-blue': 'var(--aurora-blue)',
        'aura-silver': 'var(--aura-silver)',
        'aura-silver-dark': 'var(--aura-silver-dark)',
        'dark-gray-1': 'var(--dark-gray-1)',
        'dark-gray-2': 'var(--dark-gray-2)',
      },
    },
  },
};
```

## 3. 컴포넌트 변형 가이드

현재 보유 중인 UI 컴포넌트를 새로운 디자인 시스템에 맞게 조정하는 방법입니다.

### Alert

```tsx
// 어두운 테마를 위해 Alert 컴포넌트 변형
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground shadow-md",
  {
    variants: {
      variant: {
        default: "bg-dark-gray-2 text-white border-gray-700",
        destructive:
          "border-red-400/30 bg-red-900/20 text-red-400 dark:border-red-400/30 [&>svg]:text-red-400",
        success: 
          "border-green-400/30 bg-green-900/20 text-green-400 dark:border-green-400/30 [&>svg]:text-green-400",
        info:
          "border-purple-1/30 bg-purple-900/20 text-purple-1 dark:border-purple-1/30 [&>svg]:text-purple-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Badge

```tsx
// 어두운 테마를 위한 Badge 컴포넌트 변형
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-purple-2 text-white hover:bg-purple-2/80",
        secondary:
          "border-transparent bg-dark-gray-1 text-white hover:bg-dark-gray-1/80",
        destructive:
          "border-transparent bg-red-500/70 text-white hover:bg-red-500/50",
        outline: "text-white border-gray-700",
        success:
          "border-transparent bg-green-500/70 text-white hover:bg-green-500/50",
        pink:
          "border-transparent bg-pink-1 text-white hover:bg-pink-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Button

```tsx
// 새로운 컬러 팔레트와 그라데이션을 적용한 Button 컴포넌트
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-biofox-purple-light/50 focus-visible:ring-offset-1 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-biofox-purple text-white hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:shadow-lg hover:shadow-biofox-purple-light/20",
        gradient:
          "bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue text-white hover:shadow-lg hover:shadow-biofox-purple-light/30 hover:opacity-90",
        destructive:
          "bg-red-500/80 text-white hover:bg-red-500/60",
        outline:
          "border border-biofox-purple-light bg-transparent text-biofox-purple hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:text-white hover:border-transparent",
        secondary:
          "bg-dark-gray-1 text-white hover:bg-dark-gray-1/80",
        ghost:
          "text-white hover:bg-dark-gray-1/60",
        link: "text-aurora-violet underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// CSS 클래스를 활용한 버튼 (대안)
// globals.css에 정의된 클래스 사용
<button className="btn-primary">주요 버튼</button>
<button className="btn-secondary">보조 버튼</button>

```

### Card

```tsx
// 새로운 Card 컴포넌트 변형
<Card
  className="rounded-lg border border-biofox-purple-light/20 bg-dark-gray-1/90 text-foreground backdrop-blur-sm shadow-lg"
  {...props}
/>

<CardHeader
  className="flex flex-col space-y-1.5 p-6 text-foreground"
  {...props}
/>

<CardTitle
  className="text-xl font-semibold leading-none tracking-tight text-foreground"
  {...props}
/>

<CardDescription
  className="text-sm text-foreground/70"
  {...props}
/>

<CardContent
  className="p-6 pt-0 text-foreground"
  {...props}
/>

<CardFooter
  className="flex items-center p-6 pt-0 border-t border-biofox-purple-light/20"
  {...props}
/>

// 또는 globals.css에 정의된 클래스 사용
<div className="card">
  <h2 className="text-xl font-semibold">Card Title</h2>
  <p>Card content</p>
</div>

// 그라데이션 카드
<div className="card-gradient">
  <h2 className="text-xl font-semibold">Gradient Card</h2>
  <p>Card with gradient background</p>
</div>
```

### AuroraGradient 컴포넌트 활용

AuroraGradient 컴포넌트를 활용하여 다크 테마와 어울리는 애니메이션 배경을 만듭니다:

```tsx
// 배경에 활용
<AuroraGradient
  firstColor="139, 92, 246" // 보라색
  secondColor="244, 114, 182" // 핑크색
  thirdColor="147, 197, 253" // 하늘색
  blendingValue="soft-light"
  containerClassName="rounded-xl shadow-xl"
>
  <div className="relative z-10 p-6">
    {/* 카드 콘텐츠 */}
  </div>
</AuroraGradient>
```

### ModernGradientButton 활용

```tsx
<ModernGradientButton
  variant="primary"
  size="default"
  showIcon={true}
>
  새로운 회의
</ModernGradientButton>
```

## 4. 레이아웃 가이드

### 기본 레이아웃 구조

```tsx
<div className="flex h-screen bg-dark-gray-1 text-white">
  {/* 사이드바 */}
  <aside className="w-[80px] bg-dark-gray-1 border-r border-gray-700/50">
    {/* 사이드바 내용 */}
  </aside>
  
  {/* 메인 영역 */}
  <main className="flex-1 p-6 overflow-auto">
    {/* 메인 콘텐츠 */}
  </main>
  
  {/* 선택적: 우측 패널 */}
  <aside className="w-[300px] border-l border-gray-700/50 p-4 hidden lg:block">
    {/* 우측 패널 내용 */}
  </aside>
</div>
```

### 대시보드 레이아웃

```tsx
<div className="space-y-6">
  {/* 환영 배너 */}
  <div className="bg-gradient-to-r from-pink-1/20 to-purple-1/20 rounded-xl p-6 backdrop-blur-sm">
    <h1 className="text-2xl font-bold">안녕하세요, 김민수님!</h1>
    <p className="text-gray-300">오늘 5개의 일정이 있습니다. 모두 잘 진행 중입니다.</p>
  </div>
  
  {/* 주요 차트 */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="lg:col-span-2">
      {/* 차트 내용 */}
    </Card>
    <Card>
      {/* 사이드 정보 */}
    </Card>
  </div>
  
  {/* 하단 통계 카드 */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>월간 수입</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">₩23,249,000</div>
        <div className="text-green-400 flex items-center">+10.5% <ArrowUpIcon className="h-4 w-4 ml-1" /></div>
      </CardContent>
    </Card>
    {/* 추가 카드 */}
  </div>
</div>
```

## 5. 폰트 가이드

### 기본 폰트 설정

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'SF Pro Text', 
          'Pretendard Variable', 
          'Pretendard', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          'system-ui', 
          'Roboto', 
          'sans-serif'
        ],
      },
    },
  },
};
```

### 텍스트 크기 가이드

- 헤더(대제목): `text-2xl` (24px) ~ `text-3xl` (30px)
- 섹션 타이틀(중제목): `text-xl` (20px)
- 본문 텍스트: `text-base` (16px)
- 서브 텍스트: `text-sm` (14px)
- 작은 텍스트: `text-xs` (12px)

```tsx
<h1 className="text-2xl font-bold text-white">대시보드</h1>
<h2 className="text-xl font-semibold text-white">월간 통계</h2>
<p className="text-base text-gray-300">본문 텍스트 내용입니다.</p>
<span className="text-sm text-gray-400">추가 정보</span>
<div className="text-xs text-gray-500">마지막 업데이트: 3시간 전</div>
```

## 6. 인터랙션 & 애니메이션

### 호버 효과

버튼, 카드, 링크 등에 그라데이션 호버 효과를 적용합니다:

```tsx
<button className="px-4 py-2 bg-dark-gray-2 rounded-md border border-gray-700/50 text-white transition-all hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:border-transparent">
  버튼
</button>
```

또는 CSS 클래스를 사용합니다:

```html
<button class="btn-primary">그라데이션 버튼</button>
<button class="btn-secondary">보조 버튼</button>
```

### 애니메이션

globals.css에 미리 정의된 애니메이션 클래스를 활용합니다:

```tsx
{/* 아래에서 위로 나타나며 페이드인 */}
<div className="animate-appear delay-300">
  내용이 아래에서 위로 나타납니다.
</div>

{/* 확대되며 나타나는 효과 */}
<div className="animate-appear-zoom delay-500">
  내용이 확대되며 나타납니다.
</div>
```

딜레이 클래스를 사용하여 순차적인 애니메이션을 적용할 수 있습니다:
- `delay-100`: 0.1초 지연
- `delay-300`: 0.3초 지연
- `delay-500`: 0.5초 지연
- `delay-700`: 0.7초 지연
- `delay-1000`: 1초 지연

### 그라데이션 텍스트

GradientText 컴포넌트를 사용하여 강조 텍스트에 그라데이션을 적용합니다:

```tsx
<GradientText 
  colors={["#FF8AE2", "#8B5CF6", "#67E8F9"]} 
  size="xl" 
  weight="bold"
>
  Gradient Text Example
</GradientText>
```

### 애니메이션 설정 (tailwind.config.js)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s ease infinite',
        'appear': 'appear 0.5s ease-out forwards',
        'appear-zoom': 'appear-zoom 0.7s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        appear: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'appear-zoom': {
          'from': { opacity: '0', transform: 'scale(0.8)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
};
```

## 7. 아이콘 가이드

Lucide 아이콘을 활용한 일관된 아이콘 시스템:

```tsx
import { Home, BarChart2, Users, Settings, Bell } from 'lucide-react';

// 사이드바 아이콘 예시
<div className="flex flex-col items-center py-4">
  <Home className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors" />
  <BarChart2 className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors mt-6" />
  <Users className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors mt-6" />
  <Settings className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors mt-6" />
</div>

// 알림 아이콘 예시
<div className="relative">
  <Bell className="h-5 w-5 text-gray-300" />
  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-pink-1 flex items-center justify-center text-[10px] font-bold">
    3
  </span>
</div>
```

## 8. 반응형 디자인 가이드

### 반응형 브레이크포인트

- **sm**: 640px (작은 모바일)
- **md**: 768px (큰 모바일/작은 태블릿)
- **lg**: 1024px (태블릿/작은 노트북)
- **xl**: 1280px (노트북/데스크탑)
- **2xl**: 1536px (큰 데스크탑)

### 레이아웃 조정 예시

```tsx
// 반응형 그리드 예시
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* 그리드 아이템 */}
</div>

// 반응형 사이드바 예시
<aside className="fixed inset-y-0 left-0 w-20 md:w-64 bg-dark-gray-1 transform transition-transform duration-300 ease-in-out z-30
  -translate-x-full md:translate-x-0 ${isOpen ? 'translate-x-0' : ''}">
  {/* 사이드바 내용 */}
</aside>

// 모바일에서 숨기고 데스크탑에서만 표시
<div className="hidden lg:block">
  {/* 큰 화면에서만 보이는 콘텐츠 */}
</div>
```

## 9. 추가 컴포넌트 & 효과

### 그라데이션 텍스트

```tsx
import { GradientText } from "@/components/gradient-text";

<GradientText 
  colors={["#FF8AE2", "#8B5CF6", "#67E8F9"]} 
  size="2xl" 
  weight="bold"
  showBorder={true}
  animationSpeed={10}
>
  Welcome to Dashboard
</GradientText>
```

### 테두리 텍스트 (Outlined Text)

```tsx
import { OutlinedText } from "@/components/outlined-text";

<OutlinedText 
  text="Outlined Title" 
  textColor="white" 
  outlineColor="rgba(107, 33, 168, 0.8)" 
  fontSize="2rem" 
  fontWeight="bold" 
/>
```

### 에러 컴포넌트

```tsx
// 인라인 에러 메시지
import { ErrorMessage } from "@/components/error-message";

<ErrorMessage message="이메일 형식이 올바르지 않습니다." />

// 에러 토스트
import { ErrorToast } from "@/components/error-toast";

<ErrorToast 
  message="서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요." 
  onClose={() => console.log("Toast closed")} 
/>
```

### 유리 모피즘 카드

```tsx
<div className="rounded-xl bg-dark-gray-1/80 backdrop-blur-xl border border-biofox-purple-light/20 shadow-xl p-6">
  {/* 카드 내용 */}
</div>
```

### 발광 효과

```tsx
<div className="relative group">
  <div className="absolute -inset-1 bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue rounded-lg blur opacity-30 group-hover:opacity-70 transition-opacity"></div>
  <button className="relative bg-dark-gray-1 rounded-lg px-4 py-2 text-foreground">
    발광 효과 버튼
  </button>
</div>
```

## 10. 예시 구현

### 대시보드 헤더

```tsx
<header className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-white">안녕하세요, 김민수님!</h1>
    <p className="text-gray-400">오늘 5개의 일정이 있습니다. 7% 성공률로 잘 진행 중입니다.</p>
  </div>
  <ModernGradientButton variant="primary" showIcon={true}>
    새 미팅 생성
  </ModernGradientButton>
</header>
```

### 차트 카드

```tsx
<Card className="overflow-hidden">
  <CardHeader>
    <CardTitle>수익 트렌드</CardTitle>
    <CardDescription>최근 30일간의 수익 추이</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Recharts를 이용한 차트 */}
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="name" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: '#2E3035', 
          border: '1px solid #4b5563', 
          borderRadius: '8px',
          color: '#f9fafb'
        }} 
      />
      <Line type="monotone" dataKey="value" stroke="#ABA3F7" strokeWidth={2} dot={false} />
      <Area type="monotone" dataKey="value" fill="#ABA3F7" fillOpacity={0.2} />
    </LineChart>
  </CardContent>
</Card>
```

### 통계 카드

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card className="bg-dark-gray-2/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-gray-400">수익</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center">
        <div className="text-2xl font-bold">₩23,249,000</div>
        <div className="ml-2 text-green-400 flex items-center text-sm">
          <ArrowUpIcon className="h-4 w-4 mr-1" /> 10.5%
        </div>
      </div>
    </CardContent>
  </Card>
  
  <Card className="bg-dark-gray-2/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-gray-400">리드</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center">
        <div className="text-2xl font-bold">46</div>
        <div className="ml-2 text-green-400 flex items-center text-sm">
          <ArrowUpIcon className="h-4 w-4 mr-1" /> 3.5%
        </div>
      </div>
    </CardContent>
  </Card>
  
  <Card className="bg-dark-gray-2/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-gray-400">활동</CardTitle>
    </CardHeader>
    <CardContent>
      {/* 간단한 바 차트 */}
      <div className="flex items-end h-10 space-x-1">
        {[3, 5, 2, 7, 9, 4, 6].map((value, i) => (
          <div 
            key={i} 
            className="bg-purple-1 w-6 rounded-t-sm" 
            style={{ height: `${value * 10}%` }}
          ></div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span>토</span>
        <span>일</span>
      </div>
    </CardContent>
  </Card>
</div>
```

## 11. 접근성 고려사항

### 색상 대비
- 밝은 텍스트 색상(#FFFFFF)를 사용하여 어두운 배경에서도 텍스트가 잘 보이도록 조정
- 포인트 컬러는 충분한 대비를 갖도록 설정 (WCAG AA 기준 준수)

### 키보드 접근성
- 모든 상호작용 요소에 focus 스타일 지정
- Tab 순서 고려

### 애니메이션 감소
```tsx
// 사용자가 축소된 모션을 선호할 경우
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 12. globals.css 수정 가이드

기존 globals.css를 개선하여 새로운 디자인 시스템에 맞게 수정하는 방법을 제안합니다:

```css
@import "tailwindcss";

:root {
  /* 기본 색상 팔레트 (라이트 모드) */
  --background: #ffffff;
  --foreground: #171717;
  --biofox-purple: #6D28D9;
  --biofox-purple-light: #C0A6E3;
  --aura-silver: #D7D7D7;
  --aura-silver-dark: #BFC0C0;
  --aurora-pink: #FF8AE2;
  --aurora-violet: #8B5CF6;
  --aurora-blue: #67E8F9;
  --dark-gray-1: #383844;
  --dark-gray-2: #2E3035;
  
  /* 그라데이션 관련 변수 */
  --gradient-primary: linear-gradient(to right, var(--aurora-pink), var(--aurora-violet), var(--aurora-blue));
  --gradient-soft: linear-gradient(to right, rgba(255, 138, 226, 0.1), rgba(139, 92, 246, 0.1), rgba(103, 232, 249, 0.1));
  --shadow-glow: 0 0 15px rgba(192, 166, 227, 0.5);
  
  /* 컴포넌트 변수 */
  --card-border-radius: 0.5rem;
  --button-border-radius: 0.5rem;
  --input-border-radius: 0.375rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-noto-sans-kr), var(--font-inter), 'Pretendard', 'Noto Sans KR', Arial, sans-serif;
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

/* 커스텀 버튼 클래스 */
.btn-primary {
  background-color: var(--biofox-purple);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: var(--button-border-radius);
  font-weight: 600;
  transition: all 0.3s;
}

.btn-primary:hover {
  background-image: var(--gradient-primary);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

.btn-secondary {
  border: 1px solid var(--biofox-purple-light);
  color: var(--biofox-purple);
  padding: 0.5rem 1.5rem;
  border-radius: var(--button-border-radius);
  font-weight: 600;
  transition: all 0.3s;
  background-color: transparent;
}

.btn-secondary:hover {
  background-image: var(--gradient-primary);
  color: white;
  border-color: transparent;
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

/* 카드 스타일 */
.card {
  background-color: var(--dark-gray-1);
  color: var(--foreground);
  padding: 1.5rem;
  border-radius: var(--card-border-radius);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--biofox-purple-light);
  transition: all 0.3s;
}

.card:hover {
  box-shadow: var(--shadow-glow);
  border-color: var(--aurora-violet);
}

.card-gradient {
  background-color: var(--dark-gray-1);
  color: var(--foreground);
  padding: 1.5rem;
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-glow);
  border: 1px solid transparent;
  background-image: var(--gradient-soft);
  backdrop-filter: blur(8px);
}

/* 유틸리티 클래스 */
.text-gradient {
  background-image: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
}

/* 애니메이션 키프레임 */
@keyframes appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes appear-zoom {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 애니메이션 클래스 */
.animate-appear {
  animation: appear 0.5s ease-out forwards;
  opacity: 0;
}

.animate-appear-zoom {
  animation: appear-zoom 0.7s ease-out forwards;
  opacity: 0;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
}

/* 애니메이션 딜레이 */
.delay-100 { animation-delay: 0.1s; }
.delay-300 { animation-delay: 0.3s; }
.delay-500 { animation-delay: 0.5s; }
.delay-700 { animation-delay: 0.7s; }
.delay-1000 { animation-delay: 1s; }

/* 포커스 스타일 */
.focus-style:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--biofox-purple-light);
}

/* 글래스 모피즘 (Glass-morphism) 효과 */
.glass {
  background: rgba(56, 56, 68, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(192, 166, 227, 0.15);
  border-radius: var(--card-border-radius);
}

/* 그림자 효과 */
.shadow-glow {
  box-shadow: var(--shadow-glow);
}

.shadow-glow-hover:hover {
  box-shadow: var(--shadow-glow);
  transition: box-shadow 0.3s ease;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

/* 접근성 관련 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

## 14. 대시보드 구현 예시

다음은 완성된 디자인 시스템을 활용하여 구현한 대시보드 예시입니다:

```tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradientText } from "@/components/gradient-text";
import { ArrowUp, Home, BarChart2, Users, Settings, Bell } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Area, ResponsiveContainer } from "recharts";

// 샘플 데이터
const chartData = [
  { name: "18", value: 400 },
  { name: "19", value: 300 },
  { name: "20", value: 200 },
  { name: "21", value: 278 },
  { name: "22", value: 189 },
  { name: "23", value: 239 },
  { name: "24", value: 349 },
  { name: "25", value: 430 },
  { name: "26", value: 380 },
  { name: "27", value: 460 },
  { name: "28", value: 380 },
  { name: "29", value: 410 },
  { name: "30", value: 490 },
  { name: "31", value: 530 },
];

const activityData = [3, 5, 2, 7, 9, 4, 6];
const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* 사이드바 */}
      <aside className="w-20 bg-dark-gray-1 border-r border-biofox-purple-light/20 flex flex-col items-center py-8">
        <div className="mb-10">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue flex items-center justify-center shadow-glow">
            <span className="text-white font-bold">B</span>
          </div>
        </div>
        
        <nav className="flex flex-col items-center gap-8">
          <Home className="h-6 w-6 text-aurora-violet transition-colors" />
          <BarChart2 className="h-6 w-6 text-foreground/60 hover:text-aurora-violet transition-colors" />
          <Users className="h-6 w-6 text-foreground/60 hover:text-aurora-violet transition-colors" />
          <Settings className="h-6 w-6 text-foreground/60 hover:text-aurora-violet transition-colors" />
        </nav>
      </aside>
      
      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-8 overflow-auto">
        {/* 환영 배너 */}
        <div className="bg-gradient-to-r from-aurora-pink/10 via-aurora-violet/10 to-aurora-blue/10 rounded-xl p-6 backdrop-blur-sm border border-biofox-purple-light/20 shadow-glow animate-appear mb-8">
          <div className="flex items-center">
            <div className="flex-1">
              <GradientText size="2xl" weight="bold" colors={["#FF8AE2", "#8B5CF6", "#67E8F9"]}>
                안녕하세요, 김민수님!
              </GradientText>
              <p className="text-foreground/80 mt-2">오늘 5개의 일정이 있습니다. 7% 성공률로 잘 진행 중입니다.</p>
            </div>
            <img 
              src="/api/placeholder/150/150" 
              alt="Welcome illustration" 
              className="h-20 w-20"
            />
          </div>
        </div>
        
        {/* 주요 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 animate-appear delay-100">
            <CardHeader>
              <CardTitle>트렌드 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#383844', 
                      border: '1px solid #C0A6E3', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={2} 
                    dot={false} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    fill="#8B5CF6" 
                    fillOpacity={0.2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="animate-appear delay-300">
            <CardHeader>
              <CardTitle>통계 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="text-foreground/70 text-sm mb-1">Jason Todd</div>
                  <div className="h-2 rounded-full bg-dark-gray-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-aurora-pink to-aurora-violet w-[65%]" />
                  </div>
                  <div className="text-right text-sm mt-1">2.7K</div>
                </div>
                
                <div>
                  <div className="text-foreground/70 text-sm mb-1">Penelope Hill</div>
                  <div className="h-2 rounded-full bg-dark-gray-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-aurora-pink to-aurora-violet w-[58%]" />
                  </div>
                  <div className="text-right text-sm mt-1">2.4K</div>
                </div>
                
                <div>
                  <div className="text-foreground/70 text-sm mb-1">Peter Frald</div>
                  <div className="h-2 rounded-full bg-dark-gray-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-aurora-pink to-aurora-violet w-[42%]" />
                  </div>
                  <div className="text-right text-sm mt-1">1.5K</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 하단 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-dark-gray-1/90 backdrop-blur-sm animate-appear delay-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-foreground/70">수익</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">₩23,249,000</div>
                <div className="ml-2 text-green-400 flex items-center text-sm">
                  <ArrowUp className="h-4 w-4 mr-1" /> 10.5%
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-dark-gray-1/90 backdrop-blur-sm animate-appear delay-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-foreground/70">리드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">46</div>
                <div className="ml-2 text-green-400 flex items-center text-sm">
                  <ArrowUp className="h-4 w-4 mr-1" /> 3.5%
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-dark-gray-1/90 backdrop-blur-sm animate-appear delay-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-foreground/70">활동</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end h-10 space-x-1">
                {activityData.map((value, i) => (
                  <div 
                    key={i} 
                    className="bg-aurora-violet rounded-t-sm flex-1" 
                    style={{ height: `${value * 10}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-foreground/60">
                {weekDays.map((day, i) => (
                  <span key={i}>{day}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* 우측 패널 */}
      <aside className="w-80 border-l border-biofox-purple-light/20 p-6 hidden xl:block bg-dark-gray-1/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="text-xl font-semibold">알림</div>
          <div className="relative">
            <Bell className="h-5 w-5 text-foreground/70" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-aurora-pink flex items-center justify-center text-[10px] font-bold">
              3
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* 연락처 카드 */}
          <div className="bg-dark-gray-1 rounded-lg p-4 border border-biofox-purple-light/20">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-aurora-violet/20 flex items-center justify-center mr-3">
                <span className="text-aurora-violet font-semibold">JM</span>
              </div>
              <div>
                <div className="font-medium">Jason Musk</div>
                <div className="text-sm text-foreground/70">Zoom 통화</div>
              </div>
              <div className="ml-auto rounded-lg bg-biofox-purple-light/20 text-xs py-1 px-2">
                4:30 PM
              </div>
            </div>
          </div>
          
          {/* 추가 연락처들 */}
          <div className="bg-dark-gray-1 rounded-lg p-4 border border-biofox-purple-light/20">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-aurora-pink/20 flex items-center justify-center mr-3">
                <span className="text-aurora-pink font-semibold">GF</span>
              </div>
              <div>
                <div className="font-medium">Garold Feeber</div>
                <div className="text-sm text-foreground/70">Follow-up</div>
              </div>
              <div className="ml-auto rounded-lg bg-biofox-purple-light/20 text-xs py-1 px-2">
                5:30 PM
              </div>
            </div>
          </div>
          
          <div className="bg-dark-gray-1 rounded-lg p-4 border border-biofox-purple-light/20">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-aurora-blue/20 flex items-center justify-center mr-3">
                <span className="text-aurora-blue font-semibold">MS</span>
              </div>
              <div>
                <div className="font-medium">Mario Senjinelli</div>
                <div className="text-sm text-foreground/70">미팅</div>
              </div>
              <div className="ml-auto rounded-lg bg-aurora-pink/80 text-white text-xs py-1 px-2">
                오늘
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}## 13. 최종 구현 시 유의사항

1. **성능 최적화**
   - 복잡한 그라데이션과 애니메이션은 `will-change` 속성 활용
   - 불필요한 리렌더링 방지를 위해 컴포넌트 메모이제이션 고려
   - 큰 이미지나 무거운 그라데이션 효과는 레이지 로딩 적용

2. **테마 통합**
   - globals.css에 정의된 CSS 변수를 활용하여 테마 전환 구현
   - 다크/라이트 모드 전환 시 일관된 사용자 경험 제공
   - `next-themes` 라이브러리와 `ModernThemeSwitcher` 컴포넌트 활용

3. **컴포넌트 문서화**
   - Storybook 등을 활용하여 디자인 시스템 컴포넌트 문서화 고려
   - 각 컴포넌트의 사용 예시와 variants 명확히 문서화

4. **일관성 유지**
   - 프로젝트 전체에서 일관된 스타일 및 네이밍 컨벤션 유지
   - CSS 변수와 Tailwind 클래스를 혼합하여 사용할 때 일관성 유지
   - 컴포넌트 패턴 통일 (예: `variant`, `size` 속성 등)

5. **접근성 고려**
   - 색상 대비 WCAG 기준 준수 (특히 그라디언트 배경 위 텍스트)
   - 애니메이션 축소 옵션 제공 (`prefers-reduced-motion` 활용)
   - 모든 인터랙티브 요소에 키보드 포커스 스타일 적용

6. **반응형 디자인 검증**
   - 다양한 디바이스와 화면 크기에서 UI 컴포넌트 테스트
   - 모바일 퍼스트 접근 방식으로 작은 화면에서 큰 화면 순으로 최적화

7. **브라우저 호환성**
   - CSS 변수와 최신 CSS 기능의 브라우저 호환성 확인
   - 필요시 폴리필 또는 대체 스타일 제공
   - backdrop-filter와 같은 모던 CSS 속성에 대한 폴백(fallback) 제공

8. **애니메이션 과다 사용 피하기**
   - 같은 화면에 너무 많은 애니메이션 효과 사용 자제
   - 사용자 주의를 끌어야 하는 중요 요소에만 시각 효과 집중
   - 애니메이션 타이밍 및 이징(easing) 일관성 유지

이 가이드를 따라 디자인 시스템을 구현하면 일관되고 현대적인 UI를 만들 수 있습니다. 새로운 컴포넌트나 스타일을 추가할 때도 이 가이드라인을 참조하여 디자인 일관성을 유지하세요.# UI 컴포넌트 디자인 시스템 가이드

현재 보유하고 있는 UI 컴포넌트와 디자인 가이드를 바탕으로 새로운 디자인 시스템을 정의합니다. 이 가이드는 다크 테마를 기반으로 하는 모던하고 세련된 UI를 구현하기 위한 통합 디자인 지침입니다. 추가로 제공된 컴포넌트와 `globals.css`를 참고하여 더욱 개선된 디자인 시스템을 제안합니다.

## 1. 디자인 컨셉 & 무드

### 전체 무드
- **베이스 테마**: 다크 그레이 계열 배경과 컨테이너
- **포인트 컬러**: 파스텔톤 핑크, 퍼플, 인디고, 바이올렛 그라데이션
- **애니메이션**: 부드럽고 미묘한 그라데이션과 애니메이션 효과
- **스타일**: 모던하고 미니멀한 디자인 + 고급스러운 유리 모피즘(Glass-morphism) 요소

### 사용성 & 계층구조
- 측면 **사이드바** 내비게이션
- 메인 콘텐츠 영역(차트, 카드, 그래프)
- 우측 패널 또는 모달/다이얼로그 시스템
- 암시적 계층구조 (그림자, 투명도, 블러 효과를 통해)

## 2. 컬러 가이드

### 기본 컬러 팔레트

| 이름 | Hex | 변수명 | 용도 |
|------|------|------|------|
| 배경색 | `#0a0a0a` | `--background` | 다크 모드 배경 |
| 전경색 | `#ededed` | `--foreground` | 다크 모드 텍스트 |
| 바이오폭스 퍼플 | `#6D28D9` | `--biofox-purple` | 주요 버튼, 강조 요소 |
| 바이오폭스 퍼플 라이트 | `#C0A6E3` | `--biofox-purple-light` | 보조 버튼, 경계선 |
| 오로라 핑크 | `#FF8AE2` | `--aurora-pink` | 그라데이션 시작, 강조 요소 |
| 오로라 바이올렛 | `#8B5CF6` | `--aurora-violet` | 그라데이션 중간, 차트 요소 |
| 오로라 블루 | `#67E8F9` | `--aurora-blue` | 그라데이션 끝, 상태 표시 |
| 아우라 실버 | `#D7D7D7` | `--aura-silver` | 라이트 모드 경계선 |
| 아우라 실버 다크 | `#BFC0C0` | `--aura-silver-dark` | 비활성화된 요소 |
| 다크 그레이 1 | `#383844` | `--dark-gray-1` | 다크 모드 카드 배경 |
| 다크 그레이 2 | `#2E3035` | `--dark-gray-2` | 다크 모드 입력 필드 배경 |

### CSS 변수 및 Tailwind 설정

```js
// globals.css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --biofox-purple: #6D28D9;
  --biofox-purple-light: #C0A6E3;
  --aura-silver: #D7D7D7;
  --aura-silver-dark: #BFC0C0;
  --aurora-pink: #FF8AE2;
  --aurora-violet: #8B5CF6;
  --aurora-blue: #67E8F9;
  --dark-gray-1: #383844;
  --dark-gray-2: #2E3035;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'background': 'var(--background)',
        'foreground': 'var(--foreground)',
        'biofox-purple': 'var(--biofox-purple)',
        'biofox-purple-light': 'var(--biofox-purple-light)',
        'aurora-pink': 'var(--aurora-pink)',
        'aurora-violet': 'var(--aurora-violet)',
        'aurora-blue': 'var(--aurora-blue)',
        'aura-silver': 'var(--aura-silver)',
        'aura-silver-dark': 'var(--aura-silver-dark)',
        'dark-gray-1': 'var(--dark-gray-1)',
        'dark-gray-2': 'var(--dark-gray-2)',
      },
    },
  },
};
```

## 3. 컴포넌트 변형 가이드

현재 보유 중인 UI 컴포넌트를 새로운 디자인 시스템에 맞게 조정하는 방법입니다.

### Alert

```tsx
// 어두운 테마를 위해 Alert 컴포넌트 변형
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground shadow-md",
  {
    variants: {
      variant: {
        default: "bg-dark-gray-2 text-white border-gray-700",
        destructive:
          "border-red-400/30 bg-red-900/20 text-red-400 dark:border-red-400/30 [&>svg]:text-red-400",
        success: 
          "border-green-400/30 bg-green-900/20 text-green-400 dark:border-green-400/30 [&>svg]:text-green-400",
        info:
          "border-purple-1/30 bg-purple-900/20 text-purple-1 dark:border-purple-1/30 [&>svg]:text-purple-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Badge

```tsx
// 어두운 테마를 위한 Badge 컴포넌트 변형
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-purple-2 text-white hover:bg-purple-2/80",
        secondary:
          "border-transparent bg-dark-gray-1 text-white hover:bg-dark-gray-1/80",
        destructive:
          "border-transparent bg-red-500/70 text-white hover:bg-red-500/50",
        outline: "text-white border-gray-700",
        success:
          "border-transparent bg-green-500/70 text-white hover:bg-green-500/50",
        pink:
          "border-transparent bg-pink-1 text-white hover:bg-pink-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Button

```tsx
// 새로운 컬러 팔레트와 그라데이션을 적용한 Button 컴포넌트
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-biofox-purple-light/50 focus-visible:ring-offset-1 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-biofox-purple text-white hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:shadow-lg hover:shadow-biofox-purple-light/20",
        gradient:
          "bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue text-white hover:shadow-lg hover:shadow-biofox-purple-light/30 hover:opacity-90",
        destructive:
          "bg-red-500/80 text-white hover:bg-red-500/60",
        outline:
          "border border-biofox-purple-light bg-transparent text-biofox-purple hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:text-white hover:border-transparent",
        secondary:
          "bg-dark-gray-1 text-white hover:bg-dark-gray-1/80",
        ghost:
          "text-white hover:bg-dark-gray-1/60",
        link: "text-aurora-violet underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// CSS 클래스를 활용한 버튼 (대안)
// globals.css에 정의된 클래스 사용
<button className="btn-primary">주요 버튼</button>
<button className="btn-secondary">보조 버튼</button>

```

### Card

```tsx
// 새로운 Card 컴포넌트 변형
<Card
  className="rounded-lg border border-biofox-purple-light/20 bg-dark-gray-1/90 text-foreground backdrop-blur-sm shadow-lg"
  {...props}
/>

<CardHeader
  className="flex flex-col space-y-1.5 p-6 text-foreground"
  {...props}
/>

<CardTitle
  className="text-xl font-semibold leading-none tracking-tight text-foreground"
  {...props}
/>

<CardDescription
  className="text-sm text-foreground/70"
  {...props}
/>

<CardContent
  className="p-6 pt-0 text-foreground"
  {...props}
/>

<CardFooter
  className="flex items-center p-6 pt-0 border-t border-biofox-purple-light/20"
  {...props}
/>

// 또는 globals.css에 정의된 클래스 사용
<div className="card">
  <h2 className="text-xl font-semibold">Card Title</h2>
  <p>Card content</p>
</div>

// 그라데이션 카드
<div className="card-gradient">
  <h2 className="text-xl font-semibold">Gradient Card</h2>
  <p>Card with gradient background</p>
</div>
```

### AuroraGradient 컴포넌트 활용

AuroraGradient 컴포넌트를 활용하여 다크 테마와 어울리는 애니메이션 배경을 만듭니다:

```tsx
// 배경에 활용
<AuroraGradient
  firstColor="139, 92, 246" // 보라색
  secondColor="244, 114, 182" // 핑크색
  thirdColor="147, 197, 253" // 하늘색
  blendingValue="soft-light"
  containerClassName="rounded-xl shadow-xl"
>
  <div className="relative z-10 p-6">
    {/* 카드 콘텐츠 */}
  </div>
</AuroraGradient>
```

### ModernGradientButton 활용

```tsx
<ModernGradientButton
  variant="primary"
  size="default"
  showIcon={true}
>
  새로운 회의
</ModernGradientButton>
```

## 4. 레이아웃 가이드

### 기본 레이아웃 구조

```tsx
<div className="flex h-screen bg-dark-gray-1 text-white">
  {/* 사이드바 */}
  <aside className="w-[80px] bg-dark-gray-1 border-r border-gray-700/50">
    {/* 사이드바 내용 */}
  </aside>
  
  {/* 메인 영역 */}
  <main className="flex-1 p-6 overflow-auto">
    {/* 메인 콘텐츠 */}
  </main>
  
  {/* 선택적: 우측 패널 */}
  <aside className="w-[300px] border-l border-gray-700/50 p-4 hidden lg:block">
    {/* 우측 패널 내용 */}
  </aside>
</div>
```

### 대시보드 레이아웃

```tsx
<div className="space-y-6">
  {/* 환영 배너 */}
  <div className="bg-gradient-to-r from-pink-1/20 to-purple-1/20 rounded-xl p-6 backdrop-blur-sm">
    <h1 className="text-2xl font-bold">안녕하세요, 김민수님!</h1>
    <p className="text-gray-300">오늘 5개의 일정이 있습니다. 모두 잘 진행 중입니다.</p>
  </div>
  
  {/* 주요 차트 */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="lg:col-span-2">
      {/* 차트 내용 */}
    </Card>
    <Card>
      {/* 사이드 정보 */}
    </Card>
  </div>
  
  {/* 하단 통계 카드 */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>월간 수입</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">₩23,249,000</div>
        <div className="text-green-400 flex items-center">+10.5% <ArrowUpIcon className="h-4 w-4 ml-1" /></div>
      </CardContent>
    </Card>
    {/* 추가 카드 */}
  </div>
</div>
```

## 5. 폰트 가이드

### 기본 폰트 설정

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'SF Pro Text', 
          'Pretendard Variable', 
          'Pretendard', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          'system-ui', 
          'Roboto', 
          'sans-serif'
        ],
      },
    },
  },
};
```

### 텍스트 크기 가이드

- 헤더(대제목): `text-2xl` (24px) ~ `text-3xl` (30px)
- 섹션 타이틀(중제목): `text-xl` (20px)
- 본문 텍스트: `text-base` (16px)
- 서브 텍스트: `text-sm` (14px)
- 작은 텍스트: `text-xs` (12px)

```tsx
<h1 className="text-2xl font-bold text-white">대시보드</h1>
<h2 className="text-xl font-semibold text-white">월간 통계</h2>
<p className="text-base text-gray-300">본문 텍스트 내용입니다.</p>
<span className="text-sm text-gray-400">추가 정보</span>
<div className="text-xs text-gray-500">마지막 업데이트: 3시간 전</div>
```

## 6. 인터랙션 & 애니메이션

### 호버 효과

버튼, 카드, 링크 등에 그라데이션 호버 효과를 적용합니다:

```tsx
<button className="px-4 py-2 bg-dark-gray-2 rounded-md border border-gray-700/50 text-white transition-all hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:border-transparent">
  버튼
</button>
```

또는 CSS 클래스를 사용합니다:

```html
<button class="btn-primary">그라데이션 버튼</button>
<button class="btn-secondary">보조 버튼</button>
```

### 애니메이션

globals.css에 미리 정의된 애니메이션 클래스를 활용합니다:

```tsx
{/* 아래에서 위로 나타나며 페이드인 */}
<div className="animate-appear delay-300">
  내용이 아래에서 위로 나타납니다.
</div>

{/* 확대되며 나타나는 효과 */}
<div className="animate-appear-zoom delay-500">
  내용이 확대되며 나타납니다.
</div>
```

딜레이 클래스를 사용하여 순차적인 애니메이션을 적용할 수 있습니다:
- `delay-100`: 0.1초 지연
- `delay-300`: 0.3초 지연
- `delay-500`: 0.5초 지연
- `delay-700`: 0.7초 지연
- `delay-1000`: 1초 지연

### 그라데이션 텍스트

GradientText 컴포넌트를 사용하여 강조 텍스트에 그라데이션을 적용합니다:

```tsx
<GradientText 
  colors={["#FF8AE2", "#8B5CF6", "#67E8F9"]} 
  size="xl" 
  weight="bold"
>
  Gradient Text Example
</GradientText>
```

### 애니메이션 설정 (tailwind.config.js)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s ease infinite',
        'appear': 'appear 0.5s ease-out forwards',
        'appear-zoom': 'appear-zoom 0.7s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        appear: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'appear-zoom': {
          'from': { opacity: '0', transform: 'scale(0.8)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
};
```

## 7. 아이콘 가이드

Lucide 아이콘을 활용한 일관된 아이콘 시스템:

```tsx
import { Home, BarChart2, Users, Settings, Bell } from 'lucide-react';

// 사이드바 아이콘 예시
<div className="flex flex-col items-center py-4">
  <Home className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors" />
  <BarChart2 className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors mt-6" />
  <Users className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors mt-6" />
  <Settings className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors mt-6" />
</div>

// 알림 아이콘 예시
<div className="relative">
  <Bell className="h-5 w-5 text-gray-300" />
  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-pink-1 flex items-center justify-center text-[10px] font-bold">
    3
  </span>
</div>
```

## 8. 반응형 디자인 가이드

### 반응형 브레이크포인트

- **sm**: 640px (작은 모바일)
- **md**: 768px (큰 모바일/작은 태블릿)
- **lg**: 1024px (태블릿/작은 노트북)
- **xl**: 1280px (노트북/데스크탑)
- **2xl**: 1536px (큰 데스크탑)

### 레이아웃 조정 예시

```tsx
// 반응형 그리드 예시
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* 그리드 아이템 */}
</div>

// 반응형 사이드바 예시
<aside className="fixed inset-y-0 left-0 w-20 md:w-64 bg-dark-gray-1 transform transition-transform duration-300 ease-in-out z-30
  -translate-x-full md:translate-x-0 ${isOpen ? 'translate-x-0' : ''}">
  {/* 사이드바 내용 */}
</aside>

// 모바일에서 숨기고 데스크탑에서만 표시
<div className="hidden lg:block">
  {/* 큰 화면에서만 보이는 콘텐츠 */}
</div>
```

## 9. 추가 컴포넌트 & 효과

### 그라데이션 텍스트

```tsx
import { GradientText } from "@/components/gradient-text";

<GradientText 
  colors={["#FF8AE2", "#8B5CF6", "#67E8F9"]} 
  size="2xl" 
  weight="bold"
  showBorder={true}
  animationSpeed={10}
>
  Welcome to Dashboard
</GradientText>
```

### 테두리 텍스트 (Outlined Text)

```tsx
import { OutlinedText } from "@/components/outlined-text";

<OutlinedText 
  text="Outlined Title" 
  textColor="white" 
  outlineColor="rgba(107, 33, 168, 0.8)" 
  fontSize="2rem" 
  fontWeight="bold" 
/>
```

### 에러 컴포넌트

```tsx
// 인라인 에러 메시지
import { ErrorMessage } from "@/components/error-message";

<ErrorMessage message="이메일 형식이 올바르지 않습니다." />

// 에러 토스트
import { ErrorToast } from "@/components/error-toast";

<ErrorToast 
  message="서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요." 
  onClose={() => console.log("Toast closed")} 
/>
```

### 유리 모피즘 카드

```tsx
<div className="rounded-xl bg-dark-gray-1/80 backdrop-blur-xl border border-biofox-purple-light/20 shadow-xl p-6">
  {/* 카드 내용 */}
</div>
```

### 발광 효과

```tsx
<div className="relative group">
  <div className="absolute -inset-1 bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue rounded-lg blur opacity-30 group-hover:opacity-70 transition-opacity"></div>
  <button className="relative bg-dark-gray-1 rounded-lg px-4 py-2 text-foreground">
    발광 효과 버튼
  </button>
</div>
```

## 10. 예시 구현

### 대시보드 헤더

```tsx
<header className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-white">안녕하세요, 김민수님!</h1>
    <p className="text-gray-400">오늘 5개의 일정이 있습니다. 7% 성공률로 잘 진행 중입니다.</p>
  </div>
  <ModernGradientButton variant="primary" showIcon={true}>
    새 미팅 생성
  </ModernGradientButton>
</header>
```

### 차트 카드

```tsx
<Card className="overflow-hidden">
  <CardHeader>
    <CardTitle>수익 트렌드</CardTitle>
    <CardDescription>최근 30일간의 수익 추이</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Recharts를 이용한 차트 */}
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="name" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: '#2E3035', 
          border: '1px solid #4b5563', 
          borderRadius: '8px',
          color: '#f9fafb'
        }} 
      />
      <Line type="monotone" dataKey="value" stroke="#ABA3F7" strokeWidth={2} dot={false} />
      <Area type="monotone" dataKey="value" fill="#ABA3F7" fillOpacity={0.2} />
    </LineChart>
  </CardContent>
</Card>
```

### 통계 카드

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card className="bg-dark-gray-2/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-gray-400">수익</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center">
        <div className="text-2xl font-bold">₩23,249,000</div>
        <div className="ml-2 text-green-400 flex items-center text-sm">
          <ArrowUpIcon className="h-4 w-4 mr-1" /> 10.5%
        </div>
      </div>
    </CardContent>
  </Card>
  
  <Card className="bg-dark-gray-2/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-gray-400">리드</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center">
        <div className="text-2xl font-bold">46</div>
        <div className="ml-2 text-green-400 flex items-center text-sm">
          <ArrowUpIcon className="h-4 w-4 mr-1" /> 3.5%
        </div>
      </div>
    </CardContent>
  </Card>
  
  <Card className="bg-dark-gray-2/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-gray-400">활동</CardTitle>
    </CardHeader>
    <CardContent>
      {/* 간단한 바 차트 */}
      <div className="flex items-end h-10 space-x-1">
        {[3, 5, 2, 7, 9, 4, 6].map((value, i) => (
          <div 
            key={i} 
            className="bg-purple-1 w-6 rounded-t-sm" 
            style={{ height: `${value * 10}%` }}
          ></div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span>토</span>
        <span>일</span>
      </div>
    </CardContent>
  </Card>
</div>
```

## 11. 접근성 고려사항

### 색상 대비
- 밝은 텍스트 색상(#FFFFFF)를 사용하여 어두운 배경에서도 텍스트가 잘 보이도록 조정
- 포인트 컬러는 충분한 대비를 갖도록 설정 (WCAG AA 기준 준수)

### 키보드 접근성
- 모든 상호작용 요소에 focus 스타일 지정
- Tab 순서 고려

### 애니메이션 감소
```tsx
// 사용자가 축소된 모션을 선호할 경우
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 12. globals.css 수정 가이드

기존 globals.css를 개선하여 새로운 디자인 시스템에 맞게 수정하는 방법을 제안합니다:

```css
@import "tailwindcss";

:root {
  /* 기본 색상 팔레트 (라이트 모드) */
  --background: #ffffff;
  --foreground: #171717;
  --biofox-purple: #6D28D9;
  --biofox-purple-light: #C0A6E3;
  --aura-silver: #D7D7D7;
  --aura-silver-dark: #BFC0C0;
  --aurora-pink: #FF8AE2;
  --aurora-violet: #8B5CF6;
  --aurora-blue: #67E8F9;
  --dark-gray-1: #383844;
  --dark-gray-2: #2E3035;
  
  /* 그라데이션 관련 변수 */
  --gradient-primary: linear-gradient(to right, var(--aurora-pink), var(--aurora-violet), var(--aurora-blue));
  --gradient-soft: linear-gradient(to right, rgba(255, 138, 226, 0.1), rgba(139, 92, 246, 0.1), rgba(103, 232, 249, 0.1));
  --shadow-glow: 0 0 15px rgba(192, 166, 227, 0.5);
  
  /* 컴포넌트 변수 */
  --card-border-radius: 0.5rem;
  --button-border-radius: 0.5rem;
  --input-border-radius: 0.375rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-noto-sans-kr), var(--font-inter), 'Pretendard', 'Noto Sans KR', Arial, sans-serif;
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

/* 커스텀 버튼 클래스 */
.btn-primary {
  background-color: var(--biofox-purple);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: var(--button-border-radius);
  font-weight: 600;
  transition: all 0.3s;
}

.btn-primary:hover {
  background-image: var(--gradient-primary);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

.btn-secondary {
  border: 1px solid var(--biofox-purple-light);
  color: var(--biofox-purple);
  padding: 0.5rem 1.5rem;
  border-radius: var(--button-border-radius);
  font-weight: 600;
  transition: all 0.3s;
  background-color: transparent;
}

.btn-secondary:hover {
  background-image: var(--gradient-primary);
  color: white;
  border-color: transparent;
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

/* 카드 스타일 */
.card {
  background-color: var(--dark-gray-1);
  color: var(--foreground);
  padding: 1.5rem;
  border-radius: var(--card-border-radius);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--biofox-purple-light);
  transition: all 0.3s;
}

.card:hover {
  box-shadow: var(--shadow-glow);
  border-color: var(--aurora-violet);
}

.card-gradient {
  background-color: var(--dark-gray-1);
  color: var(--foreground);
  padding: 1.5rem;
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-glow);
  border: 1px solid transparent;
  background-image: var(--gradient-soft);
  backdrop-filter: blur(8px);
}

/* 유틸리티 클래스 */
.text-gradient {
  background-image: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
}

/* 애니메이션 키프레임 */
@keyframes appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes appear-zoom {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 애니메이션 클래스 */
.animate-appear {
  animation: appear 0.5s ease-out forwards;
  opacity: 0;
}

.animate-appear-zoom {
  animation: appear-zoom 0.7s ease-out forwards;
  opacity: 0;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
}

/* 애니메이션 딜레이 */
.delay-100 { animation-delay: 0.1s; }
.delay-300 { animation-delay: 0.3s; }
.delay-500 { animation-delay: 0.5s; }
.delay-700 { animation-delay: 0.7s; }
.delay-1000 { animation-delay: 1s; }

/* 포커스 스타일 */
.focus-style:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--biofox-purple-light);
}

/* 글래스 모피즘 (Glass-morphism) 효과 */
.glass {
  background: rgba(56, 56, 68, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(192, 166, 227, 0.15);
  border-radius: var(--card-border-radius);
}

/* 그림자 효과 */
.shadow-glow {
  box-shadow: var(--shadow-glow);
}

.shadow-glow-hover:hover {
  box-shadow: var(--shadow-glow);
  transition: box-shadow 0.3s ease;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

/* 접근성 관련 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

## 15. Alert, Badge, Dialog 컴포넌트 변형

### Alert 컴포넌트

```tsx
// 새로운 디자인 시스템을 적용한 Alert 컴포넌트
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground shadow-md",
  {
    variants: {
      variant: {
        default: "glass border-biofox-purple-light/30 text-foreground",
        destructive:
          "border-red-400/30 bg-red-900/20 text-red-400 backdrop-blur-sm [&>svg]:text-red-400",
        success: 
          "border-green-400/30 bg-green-900/20 text-green-400 backdrop-blur-sm [&>svg]:text-green-400",
        info:
          "border-aurora-blue/30 bg-aurora-blue/10 text-aurora-blue/90 backdrop-blur-sm [&>svg]:text-aurora-blue",
        warning:
          "border-amber-400/30 bg-amber-900/20 text-amber-400 backdrop-blur-sm [&>svg]:text-amber-400",
        gradient:
          "border-transparent bg-gradient-to-r from-aurora-pink/20 via-aurora-violet/20 to-aurora-blue/20 text-foreground backdrop-blur-sm"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Badge 컴포넌트

```tsx
// 새로운 디자인 시스템을 적용한 Badge 컴포넌트
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-biofox-purple-light/50 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-biofox-purple text-white hover:bg-biofox-purple/80",
        secondary:
          "border-transparent bg-dark-gray-1 text-foreground hover:bg-dark-gray-1/80",
        destructive:
          "border-transparent bg-red-500/70 text-white hover:bg-red-500/50",
        outline: "text-foreground border-biofox-purple-light/50",
        success:
          "border-transparent bg-green-500/70 text-white hover:bg-green-500/50",
        gradient:
          "border-transparent bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Dialog 컴포넌트

```tsx
// 새로운 디자인 시스템을 적용한 Dialog 컴포넌트
function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "glass data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-biofox-purple-light/30 p-6 shadow-xl duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-biofox-purple-light data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="## 14. 대시보드 구현 예시

다음은 완성된 디자인 시스템을 활용하여 구현한 대시보드 예시입니다:

```tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradientText } from "@/components/gradient-text";
import { ArrowUp, Home, BarChart2, Users, Settings, Bell } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Area, ResponsiveContainer } from "recharts";

// 샘플 데이터
const chartData = [
  { name: "18", value: 400 },
  { name: "19", value: 300 },
  { name: "20", value: 200 },
  { name: "21", value: 278 },
  { name: "22", value: 189 },
  { name: "23", value: 239 },
  { name: "24", value: 349 },
  { name: "25", value: 430 },
  { name: "26", value: 380 },
  { name: "27", value: 460 },
  { name: "28", value: 380 },
  { name: "29", value: 410 },
  { name: "30", value: 490 },
  { name: "31", value: 530 },
];

const activityData = [3, 5, 2, 7, 9, 4, 6];
const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* 사이드바 */}
      <aside className="w-20 bg-dark-gray-1 border-r border-biofox-purple-light/20 flex flex-col items-center py-8">
        <div className="mb-10">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue flex items-center justify-center shadow-glow">
            <span className="text-white font-bold">B</span>
          </div>
        </div>
        
        <nav className="flex flex-col items-center gap-8">
          <Home className="h-6 w-6 text-aurora-violet transition-colors" />
          <BarChart2 className="h-6 w-6 text-foreground/60 hover:text-aurora-violet transition-colors" />
          <Users className="h-6 w-6 text-foreground/60 hover:text-aurora-violet transition-colors" />
          <Settings className="h-6 w-6 text-foreground/60 hover:text-aurora-violet transition-colors" />
        </nav>
      </aside>
      
      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-8 overflow-auto">
        {/* 환영 배너 */}
        <div className="bg-gradient-to-r from-aurora-pink/10 via-aurora-violet/10 to-aurora-blue/10 rounded-xl p-6 backdrop-blur-sm border border-biofox-purple-light/20 shadow-glow animate-appear mb-8">
          <div className="flex items-center">
            <div className="flex-1">
              <GradientText size="2xl" weight="bold" colors={["#FF8AE2", "#8B5CF6", "#67E8F9"]}>
                안녕하세요, 김민수님!
              </GradientText>
              <p className="text-foreground/80 mt-2">오늘 5개의 일정이 있습니다. 7% 성공률로 잘 진행 중입니다.</p>
            </div>
            <img 
              src="/api/placeholder/150/150" 
              alt="Welcome illustration" 
              className="h-20 w-20"
            />
          </div>
        </div>
        
        {/* 주요 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 animate-appear delay-100">
            <CardHeader>
              <CardTitle>트렌드 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#383844', 
                      border: '1px solid #C0A6E3', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={2} 
                    dot={false} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    fill="#8B5CF6" 
                    fillOpacity={0.2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="animate-appear delay-300">
            <CardHeader>
              <CardTitle>통계 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="text-foreground/70 text-sm mb-1">Jason Todd</div>
                  <div className="h-2 rounded-full bg-dark-gray-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-aurora-pink to-aurora-violet w-[65%]" />
                  </div>
                  <div className="text-right text-sm mt-1">2.7K</div>
                </div>
                
                <div>
                  <div className="text-foreground/70 text-sm mb-1">Penelope Hill</div>
                  <div className="h-2 rounded-full bg-dark-gray-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-aurora-pink to-aurora-violet w-[58%]" />
                  </div>
                  <div className="text-right text-sm mt-1">2.4K</div>
                </div>
                
                <div>
                  <div className="text-foreground/70 text-sm mb-1">Peter Frald</div>
                  <div className="h-2 rounded-full bg-dark-gray-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-aurora-pink to-aurora-violet w-[42%]" />
                  </div>
                  <div className="text-right text-sm mt-1">1.5K</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 하단 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-dark-gray-1/90 backdrop-blur-sm animate-appear delay-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-foreground/70">수익</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">₩23,249,000</div>
                <div className="ml-2 text-green-400 flex items-center text-sm">
                  <ArrowUp className="h-4 w-4 mr-1" /> 10.5%
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-dark-gray-1/90 backdrop-blur-sm animate-appear delay-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-foreground/70">리드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">46</div>
                <div className="ml-2 text-green-400 flex items-center text-sm">
                  <ArrowUp className="h-4 w-4 mr-1" /> 3.5%
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-dark-gray-1/90 backdrop-blur-sm animate-appear delay-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-foreground/70">활동</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end h-10 space-x-1">
                {activityData.map((value, i) => (
                  <div 
                    key={i} 
                    className="bg-aurora-violet rounded-t-sm flex-1" 
                    style={{ height: `${value * 10}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-foreground/60">
                {weekDays.map((day, i) => (
                  <span key={i}>{day}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* 우측 패널 */}
      <aside className="w-80 border-l border-biofox-purple-light/20 p-6 hidden xl:block bg-dark-gray-1/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="text-xl font-semibold">알림</div>
          <div className="relative">
            <Bell className="h-5 w-5 text-foreground/70" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-aurora-pink flex items-center justify-center text-[10px] font-bold">
              3
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* 연락처 카드 */}
          <div className="bg-dark-gray-1 rounded-lg p-4 border border-biofox-purple-light/20">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-aurora-violet/20 flex items-center justify-center mr-3">
                <span className="text-aurora-violet font-semibold">JM</span>
              </div>
              <div>
                <div className="font-medium">Jason Musk</div>
                <div className="text-sm text-foreground/70">Zoom 통화</div>
              </div>
              <div className="ml-auto rounded-lg bg-biofox-purple-light/20 text-xs py-1 px-2">
                4:30 PM
              </div>
            </div>
          </div>
          
          {/* 추가 연락처들 */}
          <div className="bg-dark-gray-1 rounded-lg p-4 border border-biofox-purple-light/20">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-aurora-pink/20 flex items-center justify-center mr-3">
                <span className="text-aurora-pink font-semibold">GF</span>
              </div>
              <div>
                <div className="font-medium">Garold Feeber</div>
                <div className="text-sm text-foreground/70">Follow-up</div>
              </div>
              <div className="ml-auto rounded-lg bg-biofox-purple-light/20 text-xs py-1 px-2">
                5:30 PM
              </div>
            </div>
          </div>
          
          <div className="bg-dark-gray-1 rounded-lg p-4 border border-biofox-purple-light/20">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-aurora-blue/20 flex items-center justify-center mr-3">
                <span className="text-aurora-blue font-semibold">MS</span>
              </div>
              <div>
                <div className="font-medium">Mario Senjinelli</div>
                <div className="text-sm text-foreground/70">미팅</div>
              </div>
              <div className="ml-auto rounded-lg bg-aurora-pink/80 text-white text-xs py-1 px-2">
                오늘
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}## 13. 최종 구현 시 유의사항

1. **성능 최적화**
   - 복잡한 그라데이션과 애니메이션은 `will-change` 속성 활용
   - 불필요한 리렌더링 방지를 위해 컴포넌트 메모이제이션 고려
   - 큰 이미지나 무거운 그라데이션 효과는 레이지 로딩 적용

2. **테마 통합**
   - globals.css에 정의된 CSS 변수를 활용하여 테마 전환 구현
   - 다크/라이트 모드 전환 시 일관된 사용자 경험 제공
   - `next-themes` 라이브러리와 `ModernThemeSwitcher` 컴포넌트 활용

3. **컴포넌트 문서화**
   - Storybook 등을 활용하여 디자인 시스템 컴포넌트 문서화 고려
   - 각 컴포넌트의 사용 예시와 variants 명확히 문서화

4. **일관성 유지**
   - 프로젝트 전체에서 일관된 스타일 및 네이밍 컨벤션 유지
   - CSS 변수와 Tailwind 클래스를 혼합하여 사용할 때 일관성 유지
   - 컴포넌트 패턴 통일 (예: `variant`, `size` 속성 등)

5. **접근성 고려**
   - 색상 대비 WCAG 기준 준수 (특히 그라디언트 배경 위 텍스트)
   - 애니메이션 축소 옵션 제공 (`prefers-reduced-motion` 활용)
   - 모든 인터랙티브 요소에 키보드 포커스 스타일 적용

6. **반응형 디자인 검증**
   - 다양한 디바이스와 화면 크기에서 UI 컴포넌트 테스트
   - 모바일 퍼스트 접근 방식으로 작은 화면에서 큰 화면 순으로 최적화

7. **브라우저 호환성**
   - CSS 변수와 최신 CSS 기능의 브라우저 호환성 확인
   - 필요시 폴리필 또는 대체 스타일 제공
   - backdrop-filter와 같은 모던 CSS 속성에 대한 폴백(fallback) 제공

8. **애니메이션 과다 사용 피하기**
   - 같은 화면에 너무 많은 애니메이션 효과 사용 자제
   - 사용자 주의를 끌어야 하는 중요 요소에만 시각 효과 집중
   - 애니메이션 타이밍 및 이징(easing) 일관성 유지

이 가이드를 따라 디자인 시스템을 구현하면 일관되고 현대적인 UI를 만들 수 있습니다. 새로운 컴포넌트나 스타일을 추가할 때도 이 가이드라인을 참조하여 디자인 일관성을 유지하세요.# UI 컴포넌트 디자인 시스템 가이드

현재 보유하고 있는 UI 컴포넌트와 디자인 가이드를 바탕으로 새로운 디자인 시스템을 정의합니다. 이 가이드는 다크 테마를 기반으로 하는 모던하고 세련된 UI를 구현하기 위한 통합 디자인 지침입니다. 추가로 제공된 컴포넌트와 `globals.css`를 참고하여 더욱 개선된 디자인 시스템을 제안합니다.

## 1. 디자인 컨셉 & 무드

### 전체 무드
- **베이스 테마**: 다크 그레이 계열 배경과 컨테이너
- **포인트 컬러**: 파스텔톤 핑크, 퍼플, 인디고, 바이올렛 그라데이션
- **애니메이션**: 부드럽고 미묘한 그라데이션과 애니메이션 효과
- **스타일**: 모던하고 미니멀한 디자인 + 고급스러운 유리 모피즘(Glass-morphism) 요소

### 사용성 & 계층구조
- 측면 **사이드바** 내비게이션
- 메인 콘텐츠 영역(차트, 카드, 그래프)
- 우측 패널 또는 모달/다이얼로그 시스템
- 암시적 계층구조 (그림자, 투명도, 블러 효과를 통해)

## 2. 컬러 가이드

### 기본 컬러 팔레트

| 이름 | Hex | 변수명 | 용도 |
|------|------|------|------|
| 배경색 | `#0a0a0a` | `--background` | 다크 모드 배경 |
| 전경색 | `#ededed` | `--foreground` | 다크 모드 텍스트 |
| 바이오폭스 퍼플 | `#6D28D9` | `--biofox-purple` | 주요 버튼, 강조 요소 |
| 바이오폭스 퍼플 라이트 | `#C0A6E3` | `--biofox-purple-light` | 보조 버튼, 경계선 |
| 오로라 핑크 | `#FF8AE2` | `--aurora-pink` | 그라데이션 시작, 강조 요소 |
| 오로라 바이올렛 | `#8B5CF6` | `--aurora-violet` | 그라데이션 중간, 차트 요소 |
| 오로라 블루 | `#67E8F9` | `--aurora-blue` | 그라데이션 끝, 상태 표시 |
| 아우라 실버 | `#D7D7D7` | `--aura-silver` | 라이트 모드 경계선 |
| 아우라 실버 다크 | `#BFC0C0` | `--aura-silver-dark` | 비활성화된 요소 |
| 다크 그레이 1 | `#383844` | `--dark-gray-1` | 다크 모드 카드 배경 |
| 다크 그레이 2 | `#2E3035` | `--dark-gray-2` | 다크 모드 입력 필드 배경 |

### CSS 변수 및 Tailwind 설정

```js
// globals.css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --biofox-purple: #6D28D9;
  --biofox-purple-light: #C0A6E3;
  --aura-silver: #D7D7D7;
  --aura-silver-dark: #BFC0C0;
  --aurora-pink: #FF8AE2;
  --aurora-violet: #8B5CF6;
  --aurora-blue: #67E8F9;
  --dark-gray-1: #383844;
  --dark-gray-2: #2E3035;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'background': 'var(--background)',
        'foreground': 'var(--foreground)',
        'biofox-purple': 'var(--biofox-purple)',
        'biofox-purple-light': 'var(--biofox-purple-light)',
        'aurora-pink': 'var(--aurora-pink)',
        'aurora-violet': 'var(--aurora-violet)',
        'aurora-blue': 'var(--aurora-blue)',
        'aura-silver': 'var(--aura-silver)',
        'aura-silver-dark': 'var(--aura-silver-dark)',
        'dark-gray-1': 'var(--dark-gray-1)',
        'dark-gray-2': 'var(--dark-gray-2)',
      },
    },
  },
};
```

## 3. 컴포넌트 변형 가이드

현재 보유 중인 UI 컴포넌트를 새로운 디자인 시스템에 맞게 조정하는 방법입니다.

### Alert

```tsx
// 어두운 테마를 위해 Alert 컴포넌트 변형
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground shadow-md",
  {
    variants: {
      variant: {
        default: "bg-dark-gray-2 text-white border-gray-700",
        destructive:
          "border-red-400/30 bg-red-900/20 text-red-400 dark:border-red-400/30 [&>svg]:text-red-400",
        success: 
          "border-green-400/30 bg-green-900/20 text-green-400 dark:border-green-400/30 [&>svg]:text-green-400",
        info:
          "border-purple-1/30 bg-purple-900/20 text-purple-1 dark:border-purple-1/30 [&>svg]:text-purple-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Badge

```tsx
// 어두운 테마를 위한 Badge 컴포넌트 변형
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-purple-2 text-white hover:bg-purple-2/80",
        secondary:
          "border-transparent bg-dark-gray-1 text-white hover:bg-dark-gray-1/80",
        destructive:
          "border-transparent bg-red-500/70 text-white hover:bg-red-500/50",
        outline: "text-white border-gray-700",
        success:
          "border-transparent bg-green-500/70 text-white hover:bg-green-500/50",
        pink:
          "border-transparent bg-pink-1 text-white hover:bg-pink-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Button

```tsx
// 새로운 컬러 팔레트와 그라데이션을 적용한 Button 컴포넌트
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-biofox-purple-light/50 focus-visible:ring-offset-1 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-biofox-purple text-white hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:shadow-lg hover:shadow-biofox-purple-light/20",
        gradient:
          "bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue text-white hover:shadow-lg hover:shadow-biofox-purple-light/30 hover:opacity-90",
        destructive:
          "bg-red-500/80 text-white hover:bg-red-500/60",
        outline:
          "border border-biofox-purple-light bg-transparent text-biofox-purple hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:text-white hover:border-transparent",
        secondary:
          "bg-dark-gray-1 text-white hover:bg-dark-gray-1/80",
        ghost:
          "text-white hover:bg-dark-gray-1/60",
        link: "text-aurora-violet underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// CSS 클래스를 활용한 버튼 (대안)
// globals.css에 정의된 클래스 사용
<button className="btn-primary">주요 버튼</button>
<button className="btn-secondary">보조 버튼</button>

```

### Card

```tsx
// 새로운 Card 컴포넌트 변형
<Card
  className="rounded-lg border border-biofox-purple-light/20 bg-dark-gray-1/90 text-foreground backdrop-blur-sm shadow-lg"
  {...props}
/>

<CardHeader
  className="flex flex-col space-y-1.5 p-6 text-foreground"
  {...props}
/>

<CardTitle
  className="text-xl font-semibold leading-none tracking-tight text-foreground"
  {...props}
/>

<CardDescription
  className="text-sm text-foreground/70"
  {...props}
/>

<CardContent
  className="p-6 pt-0 text-foreground"
  {...props}
/>

<CardFooter
  className="flex items-center p-6 pt-0 border-t border-biofox-purple-light/20"
  {...props}
/>

// 또는 globals.css에 정의된 클래스 사용
<div className="card">
  <h2 className="text-xl font-semibold">Card Title</h2>
  <p>Card content</p>
</div>

// 그라데이션 카드
<div className="card-gradient">
  <h2 className="text-xl font-semibold">Gradient Card</h2>
  <p>Card with gradient background</p>
</div>
```

### AuroraGradient 컴포넌트 활용

AuroraGradient 컴포넌트를 활용하여 다크 테마와 어울리는 애니메이션 배경을 만듭니다:

```tsx
// 배경에 활용
<AuroraGradient
  firstColor="139, 92, 246" // 보라색
  secondColor="244, 114, 182" // 핑크색
  thirdColor="147, 197, 253" // 하늘색
  blendingValue="soft-light"
  containerClassName="rounded-xl shadow-xl"
>
  <div className="relative z-10 p-6">
    {/* 카드 콘텐츠 */}
  </div>
</AuroraGradient>
```

### ModernGradientButton 활용

```tsx
<ModernGradientButton
  variant="primary"
  size="default"
  showIcon={true}
>
  새로운 회의
</ModernGradientButton>
```

## 4. 레이아웃 가이드

### 기본 레이아웃 구조

```tsx
<div className="flex h-screen bg-dark-gray-1 text-white">
  {/* 사이드바 */}
  <aside className="w-[80px] bg-dark-gray-1 border-r border-gray-700/50">
    {/* 사이드바 내용 */}
  </aside>
  
  {/* 메인 영역 */}
  <main className="flex-1 p-6 overflow-auto">
    {/* 메인 콘텐츠 */}
  </main>
  
  {/* 선택적: 우측 패널 */}
  <aside className="w-[300px] border-l border-gray-700/50 p-4 hidden lg:block">
    {/* 우측 패널 내용 */}
  </aside>
</div>
```

### 대시보드 레이아웃

```tsx
<div className="space-y-6">
  {/* 환영 배너 */}
  <div className="bg-gradient-to-r from-pink-1/20 to-purple-1/20 rounded-xl p-6 backdrop-blur-sm">
    <h1 className="text-2xl font-bold">안녕하세요, 김민수님!</h1>
    <p className="text-gray-300">오늘 5개의 일정이 있습니다. 모두 잘 진행 중입니다.</p>
  </div>
  
  {/* 주요 차트 */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="lg:col-span-2">
      {/* 차트 내용 */}
    </Card>
    <Card>
      {/* 사이드 정보 */}
    </Card>
  </div>
  
  {/* 하단 통계 카드 */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>월간 수입</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">₩23,249,000</div>
        <div className="text-green-400 flex items-center">+10.5% <ArrowUpIcon className="h-4 w-4 ml-1" /></div>
      </CardContent>
    </Card>
    {/* 추가 카드 */}
  </div>
</div>
```

## 5. 폰트 가이드

### 기본 폰트 설정

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'SF Pro Text', 
          'Pretendard Variable', 
          'Pretendard', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          'system-ui', 
          'Roboto', 
          'sans-serif'
        ],
      },
    },
  },
};
```

### 텍스트 크기 가이드

- 헤더(대제목): `text-2xl` (24px) ~ `text-3xl` (30px)
- 섹션 타이틀(중제목): `text-xl` (20px)
- 본문 텍스트: `text-base` (16px)
- 서브 텍스트: `text-sm` (14px)
- 작은 텍스트: `text-xs` (12px)

```tsx
<h1 className="text-2xl font-bold text-white">대시보드</h1>
<h2 className="text-xl font-semibold text-white">월간 통계</h2>
<p className="text-base text-gray-300">본문 텍스트 내용입니다.</p>
<span className="text-sm text-gray-400">추가 정보</span>
<div className="text-xs text-gray-500">마지막 업데이트: 3시간 전</div>
```

## 6. 인터랙션 & 애니메이션

### 호버 효과

버튼, 카드, 링크 등에 그라데이션 호버 효과를 적용합니다:

```tsx
<button className="px-4 py-2 bg-dark-gray-2 rounded-md border border-gray-700/50 text-white transition-all hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:border-transparent">
  버튼
</button>
```

또는 CSS 클래스를 사용합니다:

```html
<button class="btn-primary">그라데이션 버튼</button>
<button class="btn-secondary">보조 버튼</button>
```

### 애니메이션

globals.css에 미리 정의된 애니메이션 클래스를 활용합니다:

```tsx
{/* 아래에서 위로 나타나며 페이드인 */}
<div className="animate-appear delay-300">
  내용이 아래에서 위로 나타납니다.
</div>

{/* 확대되며 나타나는 효과 */}
<div className="animate-appear-zoom delay-500">
  내용이 확대되며 나타납니다.
</div>
```

딜레이 클래스를 사용하여 순차적인 애니메이션을 적용할 수 있습니다:
- `delay-100`: 0.1초 지연
- `delay-300`: 0.3초 지연
- `delay-500`: 0.5초 지연
- `delay-700`: 0.7초 지연
- `delay-1000`: 1초 지연

### 그라데이션 텍스트

GradientText 컴포넌트를 사용하여 강조 텍스트에 그라데이션을 적용합니다:

```tsx
<GradientText 
  colors={["#FF8AE2", "#8B5CF6", "#67E8F9"]} 
  size="xl" 
  weight="bold"
>
  Gradient Text Example
</GradientText>
```

### 애니메이션 설정 (tailwind.config.js)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s ease infinite',
        'appear': 'appear 0.5s ease-out forwards',
        'appear-zoom': 'appear-zoom 0.7s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        appear: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'appear-zoom': {
          'from': { opacity: '0', transform: 'scale(0.8)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
};
```

## 7. 아이콘 가이드

Lucide 아이콘을 활용한 일관된 아이콘 시스템:

```tsx
import { Home, BarChart2, Users, Settings, Bell } from 'lucide-react';

// 사이드바 아이콘 예시
<div className="flex flex-col items-center py-4">
  <Home className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors" />
  <BarChart2 className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors mt-6" />
  <Users className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors mt-6" />
  <Settings className="h-6 w-6 text-gray-400 hover:text-purple-1 transition-colors mt-6" />
</div>

// 알림 아이콘 예시
<div className="relative">
  <Bell className="h-5 w-5 text-gray-300" />
  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-pink-1 flex items-center justify-center text-[10px] font-bold">
    3
  </span>
</div>
```

## 8. 반응형 디자인 가이드

### 반응형 브레이크포인트

- **sm**: 640px (작은 모바일)
- **md**: 768px (큰 모바일/작은 태블릿)
- **lg**: 1024px (태블릿/작은 노트북)
- **xl**: 1280px (노트북/데스크탑)
- **2xl**: 1536px (큰 데스크탑)

### 레이아웃 조정 예시

```tsx
// 반응형 그리드 예시
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* 그리드 아이템 */}
</div>

// 반응형 사이드바 예시
<aside className="fixed inset-y-0 left-0 w-20 md:w-64 bg-dark-gray-1 transform transition-transform duration-300 ease-in-out z-30
  -translate-x-full md:translate-x-0 ${isOpen ? 'translate-x-0' : ''}">
  {/* 사이드바 내용 */}
</aside>

// 모바일에서 숨기고 데스크탑에서만 표시
<div className="hidden lg:block">
  {/* 큰 화면에서만 보이는 콘텐츠 */}
</div>
```

## 9. 추가 컴포넌트 & 효과

### 그라데이션 텍스트

```tsx
import { GradientText } from "@/components/gradient-text";

<GradientText 
  colors={["#FF8AE2", "#8B5CF6", "#67E8F9"]} 
  size="2xl" 
  weight="bold"
  showBorder={true}
  animationSpeed={10}
>
  Welcome to Dashboard
</GradientText>
```

### 테두리 텍스트 (Outlined Text)

```tsx
import { OutlinedText } from "@/components/outlined-text";

<OutlinedText 
  text="Outlined Title" 
  textColor="white" 
  outlineColor="rgba(107, 33, 168, 0.8)" 
  fontSize="2rem" 
  fontWeight="bold" 
/>
```

### 에러 컴포넌트

```tsx
// 인라인 에러 메시지
import { ErrorMessage } from "@/components/error-message";

<ErrorMessage message="이메일 형식이 올바르지 않습니다." />

// 에러 토스트
import { ErrorToast } from "@/components/error-toast";

<ErrorToast 
  message="서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요." 
  onClose={() => console.log("Toast closed")} 
/>
```

### 유리 모피즘 카드

```tsx
<div className="rounded-xl bg-dark-gray-1/80 backdrop-blur-xl border border-biofox-purple-light/20 shadow-xl p-6">
  {/* 카드 내용 */}
</div>
```

### 발광 효과

```tsx
<div className="relative group">
  <div className="absolute -inset-1 bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue rounded-lg blur opacity-30 group-hover:opacity-70 transition-opacity"></div>
  <button className="relative bg-dark-gray-1 rounded-lg px-4 py-2 text-foreground">
    발광 효과 버튼
  </button>
</div>
```

## 10. 예시 구현

### 대시보드 헤더

```tsx
<header className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-white">안녕하세요, 김민수님!</h1>
    <p className="text-gray-400">오늘 5개의 일정이 있습니다. 7% 성공률로 잘 진행 중입니다.</p>
  </div>
  <ModernGradientButton variant="primary" showIcon={true}>
    새 미팅 생성
  </ModernGradientButton>
</header>
```

### 차트 카드

```tsx
<Card className="overflow-hidden">
  <CardHeader>
    <CardTitle>수익 트렌드</CardTitle>
    <CardDescription>최근 30일간의 수익 추이</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Recharts를 이용한 차트 */}
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="name" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: '#2E3035', 
          border: '1px solid #4b5563', 
          borderRadius: '8px',
          color: '#f9fafb'
        }} 
      />
      <Line type="monotone" dataKey="value" stroke="#ABA3F7" strokeWidth={2} dot={false} />
      <Area type="monotone" dataKey="value" fill="#ABA3F7" fillOpacity={0.2} />
    </LineChart>
  </CardContent>
</Card>
```

### 통계 카드

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card className="bg-dark-gray-2/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-gray-400">수익</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center">
        <div className="text-2xl font-bold">₩23,249,000</div>
        <div className="ml-2 text-green-400 flex items-center text-sm">
          <ArrowUpIcon className="h-4 w-4 mr-1" /> 10.5%
        </div>
      </div>
    </CardContent>
  </Card>
  
  <Card className="bg-dark-gray-2/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-gray-400">리드</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center">
        <div className="text-2xl font-bold">46</div>
        <div className="ml-2 text-green-400 flex items-center text-sm">
          <ArrowUpIcon className="h-4 w-4 mr-1" /> 3.5%
        </div>
      </div>
    </CardContent>
  </Card>
  
  <Card className="bg-dark-gray-2/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-gray-400">활동</CardTitle>
    </CardHeader>
    <CardContent>
      {/* 간단한 바 차트 */}
      <div className="flex items-end h-10 space-x-1">
        {[3, 5, 2, 7, 9, 4, 6].map((value, i) => (
          <div 
            key={i} 
            className="bg-purple-1 w-6 rounded-t-sm" 
            style={{ height: `${value * 10}%` }}
          ></div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span>토</span>
        <span>일</span>
      </div>
    </CardContent>
  </Card>
</div>
```

## 11. 접근성 고려사항

### 색상 대비
- 밝은 텍스트 색상(#FFFFFF)를 사용하여 어두운 배경에서도 텍스트가 잘 보이도록 조정
- 포인트 컬러는 충분한 대비를 갖도록 설정 (WCAG AA 기준 준수)

### 키보드 접근성
- 모든 상호작용 요소에 focus 스타일 지정
- Tab 순서 고려

### 애니메이션 감소
```tsx
// 사용자가 축소된 모션을 선호할 경우
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 12. globals.css 수정 가이드

기존 globals.css를 개선하여 새로운 디자인 시스템에 맞게 수정하는 방법을 제안합니다:

```css
@import "tailwindcss";

:root {
  /* 기본 색상 팔레트 (라이트 모드) */
  --background: #ffffff;
  --foreground: #171717;
  --biofox-purple: #6D28D9;
  --biofox-purple-light: #C0A6E3;
  --aura-silver: #D7D7D7;
  --aura-silver-dark: #BFC0C0;
  --aurora-pink: #FF8AE2;
  --aurora-violet: #8B5CF6;
  --aurora-blue: #67E8F9;
  --dark-gray-1: #383844;
  --dark-gray-2: #2E3035;
  
  /* 그라데이션 관련 변수 */
  --gradient-primary: linear-gradient(to right, var(--aurora-pink), var(--aurora-violet), var(--aurora-blue));
  --gradient-soft: linear-gradient(to right, rgba(255, 138, 226, 0.1), rgba(139, 92, 246, 0.1), rgba(103, 232, 249, 0.1));
  --shadow-glow: 0 0 15px rgba(192, 166, 227, 0.5);
  
  /* 컴포넌트 변수 */
  --card-border-radius: 0.5rem;
  --button-border-radius: 0.5rem;
  --input-border-radius: 0.375rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-noto-sans-kr), var(--font-inter), 'Pretendard', 'Noto Sans KR', Arial, sans-serif;
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

/* 커스텀 버튼 클래스 */
.btn-primary {
  background-color: var(--biofox-purple);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: var(--button-border-radius);
  font-weight: 600;
  transition: all 0.3s;
}

.btn-primary:hover {
  background-image: var(--gradient-primary);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

.btn-secondary {
  border: 1px solid var(--biofox-purple-light);
  color: var(--biofox-purple);
  padding: 0.5rem 1.5rem;
  border-radius: var(--button-border-radius);
  font-weight: 600;
  transition: all 0.3s;
  background-color: transparent;
}

.btn-secondary:hover {
  background-image: var(--gradient-primary);
  color: white;
  border-color: transparent;
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

/* 카드 스타일 */
.card {
  background-color: var(--dark-gray-1);
  color: var(--foreground);
  padding: 1.5rem;
  border-radius: var(--card-border-radius);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--biofox-purple-light);
  transition: all 0.3s;
}

.card:hover {
  box-shadow: var(--shadow-glow);
  border-color: var(--aurora-violet);
}

.card-gradient {
  background-color: var(--dark-gray-1);
  color: var(--foreground);
  padding: 1.5rem;
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-glow);
  border: 1px solid transparent;
  background-image: var(--gradient-soft);
  backdrop-filter: blur(8px);
}

/* 유틸리티 클래스 */
.text-gradient {
  background-image: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
}

/* 애니메이션 키프레임 */
@keyframes appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes appear-zoom {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 애니메이션 클래스 */
.animate-appear {
  animation: appear 0.5s ease-out forwards;
  opacity: 0;
}

.animate-appear-zoom {
  animation: appear-zoom 0.7s ease-out forwards;
  opacity: 0;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
}

/* 애니메이션 딜레이 */
.delay-100 { animation-delay: 0.1s; }
.delay-300 { animation-delay: 0.3s; }
.delay-500 { animation-delay: 0.5s; }
.delay-700 { animation-delay: 0.7s; }
.delay-1000 { animation-delay: 1s; }

/* 포커스 스타일 */
.focus-style:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--biofox-purple-light);
}

/* 글래스 모피즘 (Glass-morphism) 효과 */
.glass {
  background: rgba(56, 56, 68, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(192, 166, 227, 0.15);
  border-radius: var(--card-border-radius);
}

/* 그림자 효과 */
.shadow-glow {
  box-shadow: var(--shadow-glow);
}

.shadow-glow-hover:hover {
  box-shadow: var(--shadow-glow);
  transition: box-shadow 0.3s ease;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

/* 접근성 관련 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}