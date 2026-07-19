import type { PortfolioContent } from "../types";
import { brazilianPortugueseVisualLabels } from "../visualLabels";

export const brazilianPortuguesePortfolioContent = {
  locale: "pt-BR",
  metadata: {
    title: "Yuri Rocha - Software para robótica e IA física",
    description:
      "Portfólio de Yuri Rocha, engenheiro sênior de software para robótica que desenvolve controladores de robôs em tempo real, interfaces para agentes, sistemas de planejamento de movimento e infraestrutura de LLMOps baseada em Kubernetes.",
  },
  profile: {
    skipLinkLabel: "Pular para o conteúdo",
    identity: {
      name: "Yuri Rocha",
      title: "Software para robótica · IA física",
      homeLabel: "Página inicial de Yuri Rocha",
    },
    navigation: [
      { id: "nav-career", label: "Carreira", targetId: "career" },
      { id: "nav-professional", label: "Projetos", targetId: "professional" },
      { id: "nav-open-source", label: "Código aberto", targetId: "open-source" },
      { id: "nav-research", label: "Pesquisa", targetId: "research" },
      { id: "nav-skills", label: "Competências", targetId: "skills" },
      { id: "nav-contact", label: "Contato", targetId: "contact" },
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
        label: "Currículo",
        href: "./cv/yuri-rocha-cv-pt-BR.pdf",
        locations: ["hero", "footer"],
      },
      {
        id: "email",
        label: "E-mail",
        href: "mailto:yurirocha15@gmail.com",
        locations: ["hero", "footer"],
        hideOnMobile: true,
      },
    ],
    hero: {
      metadata: [
        "Engenheiro sênior de software para robótica",
        "C++ · ROS 2 · Linux",
        "Seul, Coreia do Sul",
      ],
      heading: "Construindo software confiável para IA física.",
      lead:
        "Projeto software de controle de robôs em tempo real e interfaces que conectam fluxos de trabalho agênticos a robôs colaborativos. Minha atuação também abrange planejamento de movimento industrial, otimização de modelos de IA e grafos computacionais e infraestrutura de LLMOps e simulação baseada em Kubernetes.",
    },
    engineeringProfile: {
      label: "Perfil de engenharia",
      title: "Arquitetura de software para robótica e IA física",
      groups: [
        {
          id: "capability-robot-software",
          title: "Software para robôs",
          items: ["C++", "Linux", "ROS / ROS 2", "MoveIt", "OMPL"],
        },
        {
          id: "capability-ml",
          title: "ML e otimização de modelos",
          items: ["Python", "PyTorch", "ONNX", "LLMs", "Quantização"],
        },
        {
          id: "capability-infrastructure",
          title: "Infraestrutura",
          items: ["Kubernetes", "Docker", "GitHub Actions", "CI/CD", "LLMOps"],
        },
        {
          id: "capability-simulation",
          title: "Simulação e aprendizado em robótica",
          items: [
            "Isaac Sim",
            "MuJoCo",
            "Unity",
            "Gazebo",
            "Aprendizado por reforço",
          ],
        },
      ],
    },
    contact: {
      eyebrow: "Contato",
      location: "Seul, Coreia do Sul",
      email: "yurirocha15@gmail.com",
      emailHref: "mailto:yurirocha15@gmail.com",
    },
    labels: {
      mainNavigation: "Navegação principal",
      openMenu: "Abrir menu",
      closeMenu: "Fechar menu",
      languageSelector: "Seletor de idioma",
      switchToEnglish: "Mudar para inglês",
      switchToKorean: "Mudar para coreano",
      switchToPortuguese: "Mudar para português (Brasil)",
      primaryLinks: "Links principais",
      roleAndLocation: "Cargo e localização",
      engineeringCapabilities: "Competências em software para robótica e IA física",
      contributionTotals: "Totais de contribuições",
      publicPullRequests: "Pull requests públicos",
      contributionsTitle: "Contribuições para código aberto",
      repositories: "repositórios",
      mergedPullRequests: "PRs mesclados",
      spokenLanguages: "Idiomas falados",
      technologiesForProject: (title) => `Tecnologias usadas em ${title}`,
      technologiesForExperience: (company) => `Tecnologias usadas em ${company}`,
      technologiesForContribution: (repository) =>
        `Tecnologias usadas nas contribuições para ${repository}`,
      skillsForGroup: (title) => `Competências em ${title}`,
    },
  },
  sections: {
    career: { id: "career", title: "Carreira", tone: "paper" },
    professional: {
      id: "professional",
      title: "Projetos profissionais",
      tone: "green",
    },
    openSource: { id: "open-source", title: "Código aberto", tone: "paper" },
    research: { id: "research", title: "Pesquisa", tone: "green" },
    awards: { id: "awards", title: "Prêmios", tone: "paper" },
    skills: { id: "skills", title: "Competências", tone: "green" },
    languages: { title: "Idiomas", tone: "paper" },
  },
  experience: [
    {
      id: "doosan-robotics",
      period: "ago.\u00a02025–presente",
      role: "Engenheiro sênior de software — AI & Software",
      company: "Doosan Robotics",
      detail:
        "Arquitetura de controladores de robôs em tempo real, interfaces para agentes operarem robôs físicos, infraestrutura de LLMOps baseada em Kubernetes e APIs C++ e pacotes ROS oficiais.",
      bullets: [
        "Arquitetura e desenvolvimento do software central em tempo real para controladores de robôs de alto desempenho, incluindo o projeto do gerenciamento de tarefas e do fluxo de dados.",
        "Desenvolvimento de interfaces de software e estruturas de suporte que permitem que fluxos de trabalho agênticos interajam com robôs reais e os operem.",
        "Gerenciamento do cluster Kubernetes interno e manutenção de pipelines de CI/CD e LLMOps para desenvolvimento e implantação contínuos.",
        "Projeto e desenvolvimento de uma plataforma web que permite implantar cargas de trabalho de inferência de LLMs e de simulação robótica no Kubernetes e monitorar suas métricas.",
        "Liderança do desenvolvimento, dos lançamentos e da manutenção contínua de APIs C++ e pacotes ROS oficiais de código aberto.",
      ],
      tags: [
        "C++",
        "Python",
        "Linux em tempo real",
        "Arquitetura de software",
        "Fluxos de trabalho agênticos",
        "ROS 2",
        "Kubernetes",
        "CI/CD",
        "LLMOps",
      ],
    },
    {
      id: "makinarocks",
      period: "set.\u00a02020–ago.\u00a02025",
      role: "Engenheiro de pesquisa em robótica e aprendizado de máquina",
      company: "MakinaRocks",
      detail:
        "Programação automatizada de robôs para grandes linhas de soldagem por pontos, planejamento paralelo em C++, implantação escalável e otimização de LLMs nos níveis de modelo e grafo.",
      bullets: [
        "Liderou a arquitetura de software de um sistema de programação automatizada para linhas de montagem com soldagem por pontos com centenas de robôs, reduzindo o tempo de programação de aproximadamente seis semanas para três dias.",
        "Desenvolveu um sistema de planejamento de movimento em C++ altamente paralelizado com ROS, MoveIt e OMPL para validar pontos de trabalho, gerar e avaliar trajetórias, distribuir tarefas e coordenar robôs com prevenção de colisões; utilizou MongoDB para os dados de planejamento.",
        "Construiu e operou infraestrutura Kubernetes e Docker para cargas de trabalho de planejamento com uso intensivo de computação, além de pipelines de CI/CD baseados em Linux no GitHub Actions para compilação, testes, empacotamento e entrega.",
        "Conduziu experimentos de aprendizado por imitação e por reforço com PyTorch e desenvolveu ambientes de simulação no Unity.",
        "Criou fluxos com PyTorch e ONNX para otimização de modelos e grafos, quantização e avaliação reproduzível voltada à inferência em dispositivos móveis.",
      ],
      tags: [
        "C++",
        "Python",
        "ROS",
        "MoveIt",
        "OMPL",
        "MongoDB",
        "Kubernetes",
        "Docker",
        "PyTorch",
        "ONNX",
      ],
    },
    {
      id: "moringa-digital",
      period: "ago.\u00a02016–jul.\u00a02017",
      role: "Desenvolvedor de software",
      company: "Moringa Digital",
      detail: "Integração com ERPs e desenvolvimento de back-end web.",
      bullets: [
        "Desenvolveu um serviço em Node.js que automatizou a integração entre uma plataforma de compras públicas e os sistemas ERP dos clientes.",
        "Trabalhou diretamente com as equipes de tecnologia dos clientes.",
      ],
      tags: ["Node.js", "JavaScript", "MongoDB", "Integração"],
    },
  ],
  professionalProjects: [
    {
      id: "robot-controller-core",
      eyebrow: "Controlador de robôs na Doosan Robotics",
      title: "Núcleo do controlador de robôs em tempo real",
      description:
        "Software central em tempo real para controladores de robôs de alto desempenho, incluindo a arquitetura de gerenciamento de tarefas e fluxo de dados.",
      visual: "controller-runtime",
      layout: "standard",
      bullets: [
        "Arquitetura do gerenciamento de tarefas e do fluxo de dados no núcleo do controlador.",
        "Desenvolvimento de interfaces de software e estruturas de suporte para fluxos de trabalho agênticos que interagem com robôs reais.",
        "Liderança dos lançamentos e da manutenção de APIs C++ e pacotes ROS oficiais.",
      ],
      tags: [
        "C++",
        "Linux em tempo real",
        "Arquitetura de software",
        "Fluxos de trabalho agênticos",
        "ROS 2",
        "APIs para desenvolvedores",
      ],
    },
    {
      id: "development-infrastructure",
      eyebrow: "Plataforma de desenvolvimento na Doosan Robotics",
      title: "Plataforma Kubernetes para inferência de LLMs e simulação",
      description:
        "Plataforma web para desenvolvedores implantarem cargas de trabalho de inferência de LLMs e de simulação robótica no cluster Kubernetes interno e monitorarem suas métricas.",
      visual: "gpu-platform",
      layout: "standard",
      bullets: [
        "Implantação de cargas de trabalho de inferência de LLMs e de simulação robótica por autoatendimento.",
        "Controles de implantação e métricas das cargas de trabalho em uma interface unificada.",
        "Baseada no cluster operado internamente, nos pipelines de CI/CD e nos fluxos de LLMOps.",
      ],
      tags: [
        "Kubernetes",
        "Python",
        "LLMOps",
        "CI/CD",
        "Simulação",
        "Monitoramento",
        "Plataforma web",
      ],
    },
    {
      id: "automated-robot-programming",
      eyebrow: "Automação industrial na MakinaRocks",
      title: "Programação automatizada de robôs para linhas de soldagem",
      description:
        "Liderou a arquitetura de um sistema de programação automatizada para linhas de soldagem por pontos com centenas de robôs, reduzindo o tempo de programação de seis semanas para três dias.",
      visual: "smart-frame",
      layout: "wide-visual",
      bullets: [
        "Planejamento paralelo em C++ para validação de pontos de trabalho, geração e avaliação de trajetórias, distribuição de tarefas e coordenação com prevenção de colisões.",
        "Algoritmos de planejamento desenvolvidos com ROS, MoveIt e OMPL, apoiados pelo gerenciamento de dados no MongoDB e por infraestrutura escalável em Kubernetes e Docker.",
      ],
      tags: [
        "C++",
        "Python",
        "ROS",
        "MoveIt",
        "OMPL",
        "MongoDB",
        "Kubernetes",
        "Docker",
      ],
    },
    {
      id: "explainable-palletizer",
      eyebrow: "Equipe Zenith, NVIDIA Cosmos Cookoff",
      title: "Paletização mista explicável",
      description:
        "Sistema completo de paletização que inspeciona caixas por imagens de câmeras, rejeita itens danificados e adapta a força de preensão, a velocidade dos movimentos e o posicionamento ao conteúdo, peso e fragilidade inferidos.",
      visual: "palletizer",
      layout: "standard",
      bullets: [
        "Aplicou ajuste fino ao modelo NVIDIA Cosmos Reason 2 com LoRA usando dados sintéticos e conectou suas decisões ao Isaac Sim e ao cuRobo por meio de quatro serviços em contêineres.",
        "Primeiro lugar em um hackathon com mais de 1.600 participantes no mundo todo.",
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
          label: "Resultado da NVIDIA",
          href: "https://forums.developer.nvidia.com/t/the-results-are-in-meet-the-nvidia-cosmos-cookoff-winners-see-them-live-on-april-16/366130",
          locations: ["project"],
        },
      ],
    },
    {
      id: "model-level-llm-optimization",
      eyebrow: "Otimização de LLMs na MakinaRocks",
      title: "Otimização de LLMs e grafos ONNX para inferência em dispositivos móveis",
      description:
        "Otimização de arquiteturas de LLMs e grafos computacionais ONNX para inferência em dispositivos móveis.",
      visual: "edge-llm",
      layout: "standard",
      bullets: [
        "Criação de fluxos com PyTorch e ONNX para otimização de grafos, quantização e avaliação reproduzível de desempenho.",
        "O trabalho concentrou-se na eficiência de inferência dos modelos e na otimização de grafos estáticos.",
      ],
      tags: [
        "Python",
        "PyTorch",
        "ONNX",
        "LLMs",
        "Quantização",
        "Otimização de modelos",
        "Inferência em dispositivos móveis",
      ],
    },
  ],
  openSourceProjects: [
    {
      id: "mcp-cpp-sdk",
      eyebrow: "Ferramentas de protocolo em C++20",
      title: "mcp-cpp-sdk",
      description:
        "SDK em C++20 para conectar aplicações C++ nativas a agentes de IA por meio de ferramentas, recursos e transportes do MCP.",
      visual: "mcp",
      layout: "featured",
      bullets: ["Suporta os transportes stdio, WebSocket e Streamable HTTP."],
      tags: ["C++20", "Boost.Asio", "Corrotinas", "WebSocket", "HTTP"],
      links: [
        {
          id: "mcp-github",
          label: "GitHub",
          href: "https://github.com/yurirocha15/mcp-cpp-sdk",
          locations: ["project"],
        },
        {
          id: "mcp-docs",
          label: "Documentação",
          href: "https://yurirocha15.github.io/mcp-cpp-sdk",
          locations: ["project"],
        },
      ],
    },
    {
      id: "topic",
      eyebrow: "Operação de contêineres em Go",
      title: "topic",
      description:
        "Monitor de terminal que apresenta o uso de recursos da maneira como o software em contêineres realmente o vivencia.",
      visual: "topic",
      layout: "standard",
      bullets: [
        "CPU e memória em relação aos limites de cgroups, não apenas aos totais do host.",
        "Integração com Docker e Kubernetes, métricas de GPUs NVIDIA via NVML, controles no terminal e snapshots em JSON.",
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
      eyebrow: "Coleta de dados web em Python",
      title: "leet2git",
      description:
        "Scraper e CLI que usam uma sessão autenticada do LeetCode no navegador para importar problemas e submissões aceitas para um repositório Git estruturado.",
      visual: "leetcode",
      layout: "standard",
      bullets: [
        "Gera arquivos-fonte, testes em Python e índices README a partir dos dados coletados dos problemas.",
      ],
      tags: ["Python", "Web scraping", "CLI", "Git", "Testes"],
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
      eyebrow: "Ensino de aprendizado por reforço em código aberto",
      title: "Curso de aprendizado por reforço com Isaac Sim",
      description:
        "Desenvolvedor principal de um curso público e prático de aprendizado por reforço para o Instituto Coreano de Ciência dos Materiais.",
      visual: "kims",
      layout: "wide-balanced",
      bullets: [
        "Criou exercícios de pêndulo invertido sobre carrinho (CartPole) com PPO, desde uma única simulação até o treinamento em ambientes vetorizados no Isaac Sim.",
        "Integrou exemplos do Stable-Baselines3 e do RL-Games à base de código compartilhada do curso.",
      ],
      tags: [
        "Python",
        "Isaac Sim",
        "Aprendizado por reforço",
        "PPO",
        "Stable-Baselines3",
        "RL-Games",
      ],
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
        "Corrigiu problemas de amostragem, validade do grafo e encerramento no AIT* e EIT*, além de falhas ao chamar clear() antes de setup(); adicionou callbacks para soluções intermediárias.",
      href: "https://github.com/ompl/ompl/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
      linkLabel: "5 PRs mesclados",
      mergedPrCount: 5,
      tags: ["C++", "Planejamento de movimento", "OMPL"],
    },
    {
      id: "moveit",
      repository: "moveit/moveit",
      description:
        "Corrigiu a cópia do mundo de colisões Bullet e a tipagem de contatos com testes de regressão, além da ordem dos eixos de caixas no RViz.",
      href: "https://github.com/moveit/moveit/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
      linkLabel: "3 PRs mesclados",
      mergedPrCount: 3,
      tags: ["C++", "MoveIt", "Bullet", "RViz"],
    },
    {
      id: "ray",
      repository: "ray-project/ray",
      description:
        "Corrigiu a alocação de portas do ambiente Unity do RLlib entre workers paralelos e adicionou testes unitários para portas padrão e personalizadas.",
      href: "https://github.com/ray-project/ray/pull/13519",
      linkLabel: "PR #13519 mesclado",
      mergedPrCount: 1,
      tags: ["Python", "RLlib", "Unity", "Testes"],
    },
    {
      id: "rosdoc-lite",
      repository: "ros-infrastructure/rosdoc_lite",
      description:
        "Migrou o tratamento de URLs para Python 3 e corrigiu a decodificação de bytes ao gravar arquivos de tags do Doxygen.",
      href: "https://github.com/ros-infrastructure/rosdoc_lite/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
      linkLabel: "2 PRs mesclados",
      mergedPrCount: 2,
      tags: ["Python", "ROS", "Doxygen"],
    },
    {
      id: "rospy-message-converter",
      repository: "DFKI-NI/rospy_message_converter",
      description:
        "Adicionou níveis de log configuráveis e os propagou pela conversão de mensagens e arrays ROS aninhados.",
      href: "https://github.com/DFKI-NI/rospy_message_converter/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
      linkLabel: "2 PRs mesclados",
      mergedPrCount: 2,
      tags: ["Python", "ROS", "Logs"],
    },
    {
      id: "quill",
      repository: "odygrd/quill",
      description:
        "Corrigiu a compilação com versões antigas do GCC quando o fmt incluído no Quill era usado com sobrecargas de operadores do Boost.SML.",
      href: "https://github.com/odygrd/quill/pull/878",
      linkLabel: "PR #878 mesclado",
      mergedPrCount: 1,
      tags: ["C++", "GCC", "Boost.SML"],
    },
    {
      id: "gazebo-domain-randomization",
      repository: "neka-nat/gazebo_domain_randomization",
      description:
        "Publicou atualizações visuais em tempo de execução pelo Gazebo Transport para que câmeras ROS observem cores com randomização de domínio.",
      href: "https://github.com/neka-nat/gazebo_domain_randomization/pull/5",
      linkLabel: "PR #5 mesclado",
      mergedPrCount: 1,
      tags: ["C++", "Gazebo", "ROS"],
    },
    {
      id: "moveit-serialization",
      repository: "captain-yoshi/moveit_serialization",
      description:
        "Corrigiu a instalação de arquivos de cabeçalho C++ pelo CMake para projetos dependentes.",
      href: "https://github.com/captain-yoshi/moveit_serialization/pull/9",
      linkLabel: "PR #9 mesclado",
      mergedPrCount: 1,
      tags: ["C++", "CMake", "MoveIt"],
    },
    {
      id: "openrave-installation",
      repository: "cielavenir/openrave-installation",
      description:
        "Integrou patches do pybind11 que restauram a geração de cinemática inversa no OpenRAVE.",
      href: "https://github.com/cielavenir/openrave-installation/pull/1",
      linkLabel: "PR #1 mesclado",
      mergedPrCount: 1,
      tags: ["Python", "OpenRAVE", "pybind11"],
    },
  ],
  publications: [
    {
      id: "semantic-environment-modeling",
      year: "2020",
      title:
        "Estrutura de navegação autônoma para robôs inteligentes baseada em modelagem semântica do ambiente",
      venue: "Applied Sciences",
      href: "https://www.mdpi.com/2076-3417/10/9/3219/pdf",
    },
    {
      id: "msc-thesis",
      year: "2020",
      title:
        "Simulação mental para aprendizado e planejamento autônomos usando uma estrutura de modelagem baseada em ontologias",
      venue: "Dissertação de mestrado, Sungkyunkwan University",
      href: "./assets/Yuri_Master_Thesis.pdf",
    },
    {
      id: "mental-simulation-iros",
      year: "2019",
      title:
        "Simulação mental para aprendizado e planejamento autônomos baseada em um modelo semântico ontológico de triplas",
      venue: "CEUR Workshop Proceedings",
      href: "./assets/Mental_Simulation_IROS_2019.pdf",
    },
    {
      id: "automatic-generation-iccas",
      year: "2019",
      title:
        "Geração automática de um robô simulado a partir de uma descrição semântica baseada em ontologias",
      venue: "ICCAS",
      href: "./assets/Automatic_Generation_ICCAS2019.pdf",
    },
    {
      id: "cooperative-manipulation-ccta",
      year: "2017",
      title:
        "Projeto de controladores primitivos robustos a singularidades e com prioridade de tarefas para manipulação cooperativa",
      venue: "IEEE CCTA",
      href: "./assets/Design-of-singularity-robust-and-task-priority-primitive-controllers_CCTA_2017.pdf",
    },
  ],
  awards: [
    {
      id: "nvidia-cosmos-cookoff",
      year: "2026",
      title: "NVIDIA Cosmos Cookoff",
      detail:
        "Primeiro lugar com a equipe Zenith entre mais de 1.600 participantes de hackathon no mundo todo",
    },
    {
      id: "academic-achievement",
      year: "2019",
      title: "Prêmio por desempenho acadêmico",
      detail: "Programa de Bolsas do Governo Coreano",
    },
    {
      id: "kgsp",
      year: "2017",
      title: "Programa de Bolsas do Governo Coreano",
      detail: "Bolsista de pós-graduação",
    },
    {
      id: "larc",
      year: "2016",
      title: "Competição Latino-Americana de Robótica",
      detail:
        "Primeiro lugar com a equipe UnBeatables na Standard Platform League da competição latino-americana de futebol de robôs humanoides",
    },
    {
      id: "robocup",
      year: "2016",
      title: "RoboCup Standard Platform League",
      detail:
        "Prêmio Best Drop-in Only Team com a equipe UnBeatables na RoboCup",
    },
  ],
  skills: [
    {
      id: "robotics",
      title: "Robótica",
      items: [
        "ROS / ROS 2",
        "MoveIt",
        "OMPL",
        "Planejamento de movimento",
        "Navegação autônoma",
      ],
    },
    {
      id: "software",
      title: "Software",
      items: [
        "C++",
        "Python",
        "Go",
        "Linux",
        "JavaScript",
        "Node.js",
        "Arquitetura de software",
        "Algoritmos paralelos",
      ],
    },
    {
      id: "real-time-systems",
      title: "Sistemas em tempo real",
      items: ["Linux em tempo real", "PREEMPT_RT", "Xenomai"],
    },
    {
      id: "machine-learning",
      title: "Aprendizado de máquina",
      items: ["PyTorch", "ONNX", "LLMs", "Quantização", "Otimização de modelos"],
    },
    {
      id: "simulation",
      title: "Simulação e aprendizado em robótica",
      items: [
        "Isaac Sim",
        "MuJoCo",
        "Unity",
        "Gazebo",
        "Aprendizado por reforço",
      ],
    },
    {
      id: "infrastructure",
      title: "Infraestrutura",
      items: ["Kubernetes", "Docker", "GitHub Actions", "CI/CD", "LLMOps"],
    },
  ],
  languages: [
    { id: "portuguese", name: "Português", flag: "🇧🇷" },
    { id: "english", name: "Inglês", flag: "🇺🇸" },
    { id: "korean", name: "Coreano", flag: "🇰🇷" },
    { id: "french", name: "Francês", flag: "🇫🇷" },
  ],
  visuals: brazilianPortugueseVisualLabels,
} satisfies PortfolioContent;
