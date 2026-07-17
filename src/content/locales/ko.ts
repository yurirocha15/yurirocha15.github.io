import type { PortfolioContent } from "../types";
import { koreanVisualLabels } from "../visualLabels";

export const koreanPortfolioContent = {
  locale: "ko",
  metadata: {
    title: "유리 허샤 - 로보틱스 소프트웨어 · 피지컬 AI",
    description:
      "실시간 로봇 컨트롤러, 에이전틱 워크플로용 로봇 인터페이스, 모션 플래닝 시스템, Kubernetes 기반 LLMOps 인프라를 개발하는 시니어 로보틱스 소프트웨어 엔지니어 유리 허샤의 포트폴리오입니다.",
  },
  profile: {
    skipLinkLabel: "본문으로 건너뛰기",
    identity: {
      name: "유리 허샤",
      title: "로보틱스 소프트웨어 · 피지컬 AI",
      homeLabel: "유리 허샤 홈",
    },
    navigation: [
      { id: "nav-career", label: "경력", targetId: "career" },
      { id: "nav-professional", label: "실무 프로젝트", targetId: "professional" },
      { id: "nav-open-source", label: "오픈 소스", targetId: "open-source" },
      { id: "nav-research", label: "연구", targetId: "research" },
      { id: "nav-skills", label: "기술", targetId: "skills" },
      { id: "nav-contact", label: "연락처", targetId: "contact" },
    ],
    links: [
      {
        id: "github",
        label: "GitHub",
        href: "https://github.com/yurirocha15",
        locations: ["hero", "footer"],
        primary: true,
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/yurirocha15/",
        locations: ["hero", "footer"],
      },
      {
        id: "cv",
        label: "이력서",
        href: "./cv/yuri-rocha-cv-ko.pdf",
        locations: ["hero", "footer"],
      },
      {
        id: "email",
        label: "이메일",
        href: "mailto:yurirocha15@gmail.com",
        locations: ["hero", "footer"],
        hideOnMobile: true,
      },
    ],
    hero: {
      metadata: ["시니어 로보틱스 소프트웨어 엔지니어", "C++ · ROS 2 · Linux", "대한민국 서울"],
      heading: "피지컬 AI를 위한 신뢰성 높은 소프트웨어를 만듭니다.",
      lead:
        "협동 로봇을 위한 실시간 로봇 컨트롤러 소프트웨어와 에이전틱 워크플로 인터페이스를 설계합니다. 산업용 모션 플래닝, 모델 수준 AI 최적화, Kubernetes 기반 LLMOps 및 시뮬레이션 인프라 분야에서도 일해 왔습니다.",
    },
    engineeringProfile: {
      label: "엔지니어링 프로필",
      title: "로보틱스 및 피지컬 AI를 위한 소프트웨어 아키텍처",
      groups: [
        {
          id: "capability-robot-software",
          title: "로봇 소프트웨어",
          items: ["C++", "Linux", "ROS / ROS 2", "MoveIt", "OMPL"],
        },
        {
          id: "capability-ml",
          title: "머신러닝 및 모델 최적화",
          items: ["Python", "PyTorch", "ONNX", "LLMs", "양자화"],
        },
        {
          id: "capability-infrastructure",
          title: "인프라",
          items: ["Kubernetes", "Docker", "GitHub Actions", "CI/CD", "LLMOps"],
        },
        {
          id: "capability-simulation",
          title: "로보틱스 시뮬레이션 및 학습",
          items: ["Isaac Sim", "MuJoCo", "Unity", "Gazebo", "강화학습"],
        },
      ],
    },
    contact: {
      eyebrow: "연락처",
      location: "대한민국 서울",
      email: "yurirocha15@gmail.com",
      emailHref: "mailto:yurirocha15@gmail.com",
    },
    labels: {
      mainNavigation: "주 메뉴",
      openMenu: "메뉴 열기",
      closeMenu: "메뉴 닫기",
      languageSelector: "언어 선택",
      switchToEnglish: "영어로 전환",
      switchToKorean: "한국어로 전환",
      switchToPortuguese: "브라질 포르투갈어로 전환",
      primaryLinks: "주요 링크",
      roleAndLocation: "직무 및 위치",
      engineeringCapabilities: "로보틱스 소프트웨어 및 피지컬 AI 역량",
      contributionTotals: "기여 요약",
      publicPullRequests: "공개 PR",
      contributionsTitle: "오픈 소스 기여",
      repositories: "리포지토리",
      mergedPullRequests: "병합된 PR",
      spokenLanguages: "구사 언어",
      technologiesForProject: (title) => `${title}에 사용된 기술`,
      technologiesForExperience: (company) => `${company}에서 사용한 기술`,
      technologiesForContribution: (repository) => `${repository} 기여에 사용된 기술`,
      skillsForGroup: (title) => `${title} 기술`,
    },
  },
  sections: {
    career: { id: "career", title: "경력", tone: "paper" },
    professional: { id: "professional", title: "실무 프로젝트", tone: "green" },
    openSource: { id: "open-source", title: "오픈 소스", tone: "paper" },
    research: { id: "research", title: "연구", tone: "green" },
    awards: { id: "awards", title: "수상", tone: "paper" },
    skills: { id: "skills", title: "기술", tone: "green" },
    languages: { title: "언어", tone: "paper" },
  },
  experience: [
    {
      id: "doosan-robotics",
      period: "2025년\u00a08월–현재",
      role: "시니어 소프트웨어 엔지니어, AI & Software",
      company: "두산로보틱스",
      detail:
        "실시간 로봇 컨트롤러 아키텍처, 실제 로봇을 위한 에이전트 인터페이스, Kubernetes 기반 LLMOps 인프라, 공식 C++ API 및 ROS 패키지를 담당합니다.",
      bullets: [
        "태스크 관리와 데이터 흐름 설계를 포함한 고성능 로봇 컨트롤러의 핵심 실시간 소프트웨어를 설계하고 개발하고 있습니다.",
        "에이전틱 워크플로가 실제 로봇과 상호작용하고 이를 구동할 수 있도록 소프트웨어 인터페이스와 하네스를 개발하고 있습니다.",
        "지속적인 개발과 배포를 지원하는 내부 Kubernetes 클러스터를 운영하고 CI/CD 및 LLMOps 파이프라인을 유지보수하고 있습니다.",
        "개발자가 Kubernetes에 LLM 서빙 및 로보틱스 시뮬레이션 워크로드를 배포하고 워크로드 메트릭을 모니터링할 수 있는 웹 플랫폼을 설계하고 개발했습니다.",
        "공식 오픈 소스 C++ API와 ROS 패키지의 개발, 릴리스 및 지속적인 유지보수를 주도하고 있습니다.",
      ],
      tags: ["C++", "Python", "Real-time Linux", "소프트웨어 아키텍처", "에이전틱 워크플로", "ROS 2", "Kubernetes", "CI/CD", "LLMOps"],
    },
    {
      id: "makinarocks",
      period: "2020년\u00a09월–2025년\u00a08월",
      role: "로보틱스 및 머신러닝 리서치 엔지니어",
      company: "마키나락스",
      detail:
        "대규모 점용접 라인의 로봇 프로그램 자동 생성, 병렬 C++ 플래닝, 확장형 배포 및 모델 및 그래프 수준 LLM 최적화를 수행했습니다.",
      bullets: [
        "수백 대의 로봇이 배치된 점용접 조립 라인을 위한 로봇 프로그램 자동 생성 시스템의 아키텍처 설계를 주도해 전체 작업 소요 기간을 약 6주에서 3일로 단축했습니다.",
        "ROS, MoveIt, OMPL을 활용해 고도로 병렬화된 C++ 플래닝 알고리즘을 개발하고 MongoDB로 플래닝 데이터를 관리했습니다. 이를 통해 작업점 검증, 궤적 생성과 평가, 작업 분배 및 충돌을 고려한 로봇 간 협조를 구현했습니다.",
        "연산 집약적인 플래닝 워크로드를 위한 Kubernetes 및 Docker 인프라를 구축하고 운영했으며, 빌드, 테스트, 패키징 및 배포를 위한 Linux 기반 GitHub Actions CI/CD 파이프라인을 유지보수했습니다.",
        "PyTorch로 모방학습 및 강화학습 실험을 수행하고 Unity에서 시뮬레이션 환경을 개발했습니다.",
        "1년간의 ML 업무에서 모바일 하드웨어의 온디바이스 추론을 위한 모델 및 그래프 수준 최적화, 양자화 및 반복 가능한 평가용 PyTorch/ONNX 워크플로를 구축했습니다.",
      ],
      tags: ["C++", "Python", "ROS", "MoveIt", "OMPL", "MongoDB", "Kubernetes", "Docker", "PyTorch", "ONNX"],
    },
    {
      id: "moringa-digital",
      period: "2016년\u00a08월–2017년\u00a07월",
      role: "소프트웨어 개발자",
      company: "Moringa Digital",
      detail: "ERP 연동 및 웹 백엔드 개발을 수행했습니다.",
      bullets: [
        "공공 조달 플랫폼과 고객 ERP 시스템 간 연동을 자동화하는 Node.js 서비스를 개발했습니다.",
        "고객 기술팀과 직접 협업했습니다.",
      ],
      tags: ["Node.js", "JavaScript", "MongoDB", "시스템 연동"],
    },
  ],
  professionalProjects: [
    {
      id: "robot-controller-core",
      eyebrow: "두산로보틱스 로봇 컨트롤러",
      title: "실시간 로봇 컨트롤러 코어",
      description:
        "태스크 관리 및 데이터 흐름 아키텍처를 포함한 고성능 로봇 컨트롤러의 핵심 실시간 소프트웨어입니다.",
      visual: "controller-runtime",
      layout: "standard",
      bullets: [
        "컨트롤러 코어 전반의 태스크 관리 및 데이터 흐름을 설계합니다.",
        "실제 로봇과 상호작용하는 에이전틱 워크플로를 위한 소프트웨어 인터페이스와 하네스를 개발합니다.",
        "공식 C++ API 및 ROS 패키지의 릴리스와 유지보수를 주도합니다.",
      ],
      tags: ["C++", "Real-time Linux", "소프트웨어 아키텍처", "에이전틱 워크플로", "ROS 2", "개발자 API"],
    },
    {
      id: "development-infrastructure",
      eyebrow: "두산로보틱스 개발 플랫폼",
      title: "LLM 서빙 및 시뮬레이션용 Kubernetes 플랫폼",
      description:
        "개발자가 내부 Kubernetes 클러스터에 LLM 서빙 및 로보틱스 시뮬레이션 워크로드를 배포하고 워크로드 메트릭을 모니터링할 수 있는 웹 플랫폼입니다.",
      visual: "gpu-platform",
      layout: "standard",
      bullets: [
        "LLM 서빙 및 로보틱스 시뮬레이션 워크로드를 셀프서비스 방식으로 배포합니다.",
        "하나의 인터페이스에서 배포를 제어하고 워크로드 메트릭을 확인할 수 있습니다.",
        "내부에서 운영하는 클러스터와 CI/CD 및 LLMOps 파이프라인이 플랫폼을 뒷받침합니다.",
      ],
      tags: ["Kubernetes", "Python", "LLMOps", "CI/CD", "시뮬레이션", "모니터링", "웹 플랫폼"],
    },
    {
      id: "automated-robot-programming",
      eyebrow: "마키나락스 산업 자동화",
      title: "용접 라인 로봇 프로그램 자동 생성",
      description:
        "수백 대의 로봇이 배치된 점용접 라인을 위한 로봇 프로그램 자동 생성 시스템의 아키텍처 설계를 주도해 전체 작업 소요 기간을 6주에서 3일로 단축했습니다.",
      visual: "smart-frame",
      layout: "wide-visual",
      bullets: [
        "작업점 검증, 궤적 생성과 평가, 작업 분배 및 충돌을 고려한 로봇 간 협조를 위한 병렬 C++ 플래닝을 개발했습니다.",
        "ROS, MoveIt, OMPL 기반 플래닝 알고리즘과 MongoDB 데이터 관리를 확장 가능한 Kubernetes 및 Docker 플래닝 인프라에 통합했습니다.",
      ],
      tags: ["C++", "Python", "ROS", "MoveIt", "OMPL", "MongoDB", "Kubernetes", "Docker"],
    },
    {
      id: "explainable-palletizer",
      eyebrow: "Team Zenith, NVIDIA Cosmos Cookoff",
      title: "설명 가능한 혼합 팔레타이징",
      description:
        "카메라 이미지로 상자를 검사해 손상된 제품을 제외하고, 추론한 내용물의 종류, 무게 및 파손 가능성을 바탕으로 파지력, 이동 속도 및 적재 위치를 조정하는 엔드투엔드 팔레타이징 시스템입니다.",
      visual: "palletizer",
      layout: "standard",
      bullets: [
        "합성 데이터를 사용해 NVIDIA Cosmos Reason 2를 LoRA로 파인튜닝하고, 컨테이너화된 서비스 4개를 통해 판단 결과를 Isaac Sim과 cuRobo에 연결했습니다.",
        "전 세계 1,600명 이상이 참가한 해커톤에서 1위를 차지했습니다.",
      ],
      tags: ["Python", "Cosmos Reason 2", "LoRA", "Isaac Sim", "cuRobo", "vLLM", "Docker"],
      links: [
        {
          id: "palletizer-github",
          label: "GitHub",
          href: "https://github.com/doosan-robotics/explainable-palletizer",
          locations: ["project"],
        },
        {
          id: "palletizer-result",
          label: "NVIDIA 결과 발표",
          href: "https://forums.developer.nvidia.com/t/the-results-are-in-meet-the-nvidia-cosmos-cookoff-winners-see-them-live-on-april-16/366130",
          locations: ["project"],
        },
      ],
    },
    {
      id: "model-level-llm-optimization",
      eyebrow: "마키나락스 LLM 최적화",
      title: "모바일 추론을 위한 LLM 및 ONNX 그래프 최적화",
      description:
        "모바일 하드웨어의 온디바이스 추론을 위해 LLM 아키텍처와 ONNX 연산 그래프를 최적화했습니다.",
      visual: "edge-llm",
      layout: "standard",
      bullets: [
        "그래프 최적화, 양자화 및 반복 가능한 성능 평가를 위한 PyTorch/ONNX 워크플로를 구축했습니다.",
        "모델 추론 효율과 정적 그래프 최적화에 집중했습니다.",
      ],
      tags: ["Python", "PyTorch", "ONNX", "LLMs", "양자화", "모델 최적화", "모바일 추론"],
    },
  ],
  openSourceProjects: [
    {
      id: "mcp-cpp-sdk",
      eyebrow: "C++20 프로토콜 도구",
      title: "mcp-cpp-sdk",
      description:
        "네이티브 C++ 애플리케이션을 MCP 도구, 리소스 및 전송 백엔드를 통해 AI 에이전트와 연결하는 C++20 SDK입니다.",
      visual: "mcp",
      layout: "featured",
      bullets: ["stdio, WebSocket 및 Streamable HTTP 전송을 지원합니다."],
      tags: ["C++20", "Boost.Asio", "코루틴", "WebSocket", "HTTP"],
      links: [
        {
          id: "mcp-github",
          label: "GitHub",
          href: "https://github.com/yurirocha15/mcp-cpp-sdk",
          locations: ["project"],
        },
        {
          id: "mcp-docs",
          label: "문서",
          href: "https://yurirocha15.github.io/mcp-cpp-sdk",
          locations: ["project"],
        },
      ],
    },
    {
      id: "topic",
      eyebrow: "Go 컨테이너 운영 도구",
      title: "topic",
      description:
        "컨테이너가 실제로 사용할 수 있는 리소스를 기준으로 사용량을 보여 주는 터미널 모니터입니다.",
      visual: "topic",
      layout: "standard",
      bullets: [
        "호스트 전체가 아닌 cgroup 제한을 기준으로 CPU와 메모리를 표시합니다.",
        "Docker 및 Kubernetes 연동, NVML 기반 NVIDIA GPU 메트릭, 터미널 제어 및 JSON 스냅샷을 지원합니다.",
      ],
      tags: ["Go", "Linux", "cgroups", "Docker", "Kubernetes", "NVML"],
      links: [
        {
          id: "topic-github",
          label: "GitHub",
          href: "https://github.com/yurirocha15/topic",
          locations: ["project"],
        },
      ],
    },
    {
      id: "leet2git",
      eyebrow: "Python 웹 스크레이핑",
      title: "leet2git",
      description:
        "인증된 LeetCode 브라우저 세션으로 문제와 정답 처리된 제출 코드를 수집해 구조화된 Git 리포지토리로 가져오는 웹 스크레이퍼 및 CLI입니다.",
      visual: "leetcode",
      layout: "standard",
      bullets: ["수집한 문제 데이터에서 소스 파일, Python 테스트 및 README 색인을 생성합니다."],
      tags: ["Python", "웹 스크레이핑", "CLI", "Git", "테스트"],
      links: [
        {
          id: "leet2git-github",
          label: "GitHub",
          href: "https://github.com/yurirocha15/leetcode2github",
          locations: ["project"],
        },
      ],
    },
    {
      id: "kims-rl-curriculum",
      eyebrow: "오픈 소스 강화학습 교육",
      title: "Isaac Sim 강화학습 커리큘럼",
      description:
        "한국재료연구원을 위한 공개 실습형 강화학습 커리큘럼의 핵심 개발자로 참여했습니다.",
      visual: "kims",
      layout: "wide-balanced",
      bullets: [
        "단일 시뮬레이션부터 벡터화된 Isaac Sim 학습까지 이어지는 PPO 카트폴 실습을 구축했습니다.",
        "Stable-Baselines3 및 RL-Games 예제를 공동 교육 코드베이스에 통합했습니다.",
      ],
      tags: ["Python", "Isaac Sim", "강화학습", "PPO", "Stable-Baselines3", "RL-Games"],
      links: [
        {
          id: "kims-github",
          label: "GitHub",
          href: "https://github.com/rl-education/kims",
          locations: ["project"],
        },
      ],
    },
  ],
  contributions: [
    {
      id: "ompl",
      repository: "ompl/ompl",
      description:
        "AIT* 및 EIT*의 샘플링, 그래프 유효성 및 종료 조건 관련 오류와 setup() 전에 clear()를 호출할 때 발생하는 오류를 수정하고, 중간 해 콜백을 추가했습니다.",
      href: "https://github.com/ompl/ompl/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
      linkLabel: "병합된 PR 5개",
      mergedPrCount: 5,
      tags: ["C++", "모션 플래닝", "OMPL"],
    },
    {
      id: "moveit",
      repository: "moveit/moveit",
      description:
        "Bullet 충돌 월드 복사와 접촉 타입 문제를 회귀 테스트와 함께 수정하고 RViz 박스 축 순서를 바로잡았습니다.",
      href: "https://github.com/moveit/moveit/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
      linkLabel: "병합된 PR 3개",
      mergedPrCount: 3,
      tags: ["C++", "MoveIt", "Bullet", "RViz"],
    },
    {
      id: "ray",
      repository: "ray-project/ray",
      description:
        "병렬 워커 간 RLlib Unity 환경 포트 할당을 수정하고 기본 및 사용자 지정 포트에 대한 단위 테스트를 추가했습니다.",
      href: "https://github.com/ray-project/ray/pull/13519",
      linkLabel: "병합된 PR #13519",
      mergedPrCount: 1,
      tags: ["Python", "RLlib", "Unity", "테스트"],
    },
    {
      id: "rosdoc-lite",
      repository: "ros-infrastructure/rosdoc_lite",
      description:
        "URL 처리를 Python 3로 이식하고 Doxygen 태그 파일 작성 시 바이트 디코딩 문제를 수정했습니다.",
      href: "https://github.com/ros-infrastructure/rosdoc_lite/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
      linkLabel: "병합된 PR 2개",
      mergedPrCount: 2,
      tags: ["Python", "ROS", "Doxygen"],
    },
    {
      id: "rospy-message-converter",
      repository: "DFKI-NI/rospy_message_converter",
      description:
        "설정 가능한 로그 레벨을 추가하고 중첩된 ROS 메시지 및 배열 변환 전체에 적용했습니다.",
      href: "https://github.com/DFKI-NI/rospy_message_converter/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
      linkLabel: "병합된 PR 2개",
      mergedPrCount: 2,
      tags: ["Python", "ROS", "로깅"],
    },
    {
      id: "quill",
      repository: "odygrd/quill",
      description:
        "Quill에 번들된 fmt와 Boost.SML 연산자 오버로드를 함께 사용할 때 이전 버전 GCC에서 발생하는 컴파일 오류를 수정했습니다.",
      href: "https://github.com/odygrd/quill/pull/878",
      linkLabel: "병합된 PR #878",
      mergedPrCount: 1,
      tags: ["C++", "GCC", "Boost.SML"],
    },
    {
      id: "gazebo-domain-randomization",
      repository: "neka-nat/gazebo_domain_randomization",
      description:
        "ROS 카메라가 도메인 무작위화가 적용된 색상을 관측할 수 있도록 Gazebo Transport를 통해 런타임 시각 요소 업데이트를 게시했습니다.",
      href: "https://github.com/neka-nat/gazebo_domain_randomization/pull/5",
      linkLabel: "병합된 PR #5",
      mergedPrCount: 1,
      tags: ["C++", "Gazebo", "ROS"],
    },
    {
      id: "moveit-serialization",
      repository: "captain-yoshi/moveit_serialization",
      description: "다운스트림 프로젝트에서 사용할 수 있도록 C++ 헤더가 설치되지 않던 CMake 문제를 수정했습니다.",
      href: "https://github.com/captain-yoshi/moveit_serialization/pull/9",
      linkLabel: "병합된 PR #9",
      mergedPrCount: 1,
      tags: ["C++", "CMake", "MoveIt"],
    },
    {
      id: "openrave-installation",
      repository: "cielavenir/openrave-installation",
      description: "OpenRAVE 역기구학 생성을 복원하는 pybind11 패치를 통합했습니다.",
      href: "https://github.com/cielavenir/openrave-installation/pull/1",
      linkLabel: "병합된 PR #1",
      mergedPrCount: 1,
      tags: ["Python", "OpenRAVE", "pybind11"],
    },
  ],
  publications: [
    {
      id: "semantic-environment-modeling",
      year: "2020",
      title:
        "Autonomous Navigation Framework for Intelligent Robots Based on a Semantic Environment Modeling",
      venue: "Applied Sciences",
      href: "https://www.mdpi.com/2076-3417/10/9/3219/pdf",
    },
    {
      id: "msc-thesis",
      year: "2020",
      title:
        "Mental Simulation for Autonomous Learning and Planning Using an Ontology-Based Modeling Framework",
      venue: "성균관대학교 석사학위 논문",
      href: "./assets/Yuri_Master_Thesis.pdf",
    },
    {
      id: "mental-simulation-iros",
      year: "2019",
      title:
        "Mental Simulation for Autonomous Learning and Planning Based on Triplet Ontological Semantic Model",
      venue: "CEUR Workshop Proceedings",
      href: "./assets/Mental_Simulation_IROS_2019.pdf",
    },
    {
      id: "automatic-generation-iccas",
      year: "2019",
      title:
        "Automatic Generation of a Simulated Robot from an Ontology-Based Semantic Description",
      venue: "ICCAS",
      href: "./assets/Automatic_Generation_ICCAS2019.pdf",
    },
    {
      id: "cooperative-manipulation-ccta",
      year: "2017",
      title:
        "Design of Singularity-Robust and Task-Priority Primitive Controllers for Cooperative Manipulation",
      venue: "IEEE CCTA",
      href: "./assets/Design-of-singularity-robust-and-task-priority-primitive-controllers_CCTA_2017.pdf",
    },
  ],
  awards: [
    {
      id: "nvidia-cosmos-cookoff",
      year: "2026",
      title: "NVIDIA Cosmos Cookoff",
      detail: "전 세계 1,600명 이상이 참가한 해커톤에서 Team Zenith로 1위",
    },
    {
      id: "academic-achievement",
      year: "2019",
      title: "정부초청장학생 학업성취상",
      detail: "정부초청외국인장학사업",
    },
    {
      id: "kgsp",
      year: "2017",
      title: "정부초청외국인대학원장학생",
      detail: "대학원 장학금 수혜",
    },
    {
      id: "larc",
      year: "2016",
      title: "Latin American Robotics Competition",
      detail: "중남미 휴머노이드 로봇 축구 대회 Standard Platform League에서 UnBeatables로 1위",
    },
    {
      id: "robocup",
      year: "2016",
      title: "RoboCup Standard Platform League",
      detail: "세계 휴머노이드 로봇 축구 대회에서 UnBeatables로 Best Drop-in Only Team 수상",
    },
  ],
  skills: [
    {
      id: "robotics",
      title: "로보틱스",
      items: ["ROS / ROS 2", "MoveIt", "OMPL", "모션 플래닝", "자율주행"],
    },
    {
      id: "software",
      title: "소프트웨어",
      items: ["C++", "Python", "Go", "Linux", "JavaScript", "Node.js", "소프트웨어 아키텍처", "병렬 알고리즘"],
    },
    {
      id: "real-time-systems",
      title: "실시간 시스템",
      items: ["Real-time Linux", "PREEMPT_RT", "Xenomai"],
    },
    {
      id: "machine-learning",
      title: "머신러닝",
      items: ["PyTorch", "ONNX", "LLMs", "양자화", "모델 최적화"],
    },
    {
      id: "simulation",
      title: "로보틱스 시뮬레이션 및 학습",
      items: ["Isaac Sim", "MuJoCo", "Unity", "Gazebo", "강화학습"],
    },
    {
      id: "infrastructure",
      title: "인프라",
      items: ["Kubernetes", "Docker", "GitHub Actions", "CI/CD", "LLMOps"],
    },
  ],
  languages: [
    { id: "portuguese", name: "포르투갈어", flag: "🇧🇷" },
    { id: "english", name: "영어", flag: "🇺🇸" },
    { id: "korean", name: "한국어", flag: "🇰🇷" },
    { id: "french", name: "프랑스어", flag: "🇫🇷" },
  ],
  visuals: koreanVisualLabels,
} satisfies PortfolioContent;
