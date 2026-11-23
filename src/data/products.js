export const PRODUCTS = [
  {
    id: 'dove',
    name: 'Condicionador Dove',
    subtitle: 'Reconstrução Completa',
    category: 'Cuidados Pessoais',
    badge: '100% PCR',
    imageUrl: '/imagens/dove.png',
    modelUrl: '/modelos/dove.glb',
    description: 'Nutrição celular e reparação profunda com fórmula bio-ativa e frasco fabricado com plástico 100% reciclado.',
    volume: '370ml',
    hotspots: [
      {
        id: 'tampa',
        index: 1,
        title: 'Tampa Dosadora Eco-Design',
        badge: 'Eco-Design',
        description: 'Mecanismo ergonômico com 25% menos plástico virgem, 100% reciclável e vedação precisa anti-desperdício.',
        position: [0, 0.23, 0.08],
        target: [0, 0.23, 0.0]
      },
      {
        id: 'formula',
        index: 2,
        title: 'Fórmula com Nutri-Queratina',
        badge: 'Nutrição Ativa',
        description: 'Moléculas bio-ativas que reconstroem o córtex e alinham as cutículas capilares desde a 1ª aplicação.',
        position: [0.12, 0.02, 0.1],
        target: [0.06, 0.02, 0.0]
      },
      {
        id: 'sustentabilidade',
        index: 3,
        title: 'Frasco 100% Reciclado (PCR)',
        badge: 'Economia Circular',
        description: 'Produzido com plástico pós-consumo reciclado, diminuindo a pegada de carbono e apoiando a economia circular.',
        position: [-0.12, -0.18, 0.08],
        target: [-0.06, -0.18, 0.0]
      }
    ]
  },
  {
    id: 'maionese',
    name: "Maionese Hellmann's",
    subtitle: 'A Verdadeira',
    category: 'Alimentos & Nutrição',
    badge: 'Eco-PET',
    imageUrl: '/imagens/maionese.png',
    modelUrl: '/modelos/maionese.glb',
    description: 'Sabor inconfundível elaborado com ovos caipiras certificados em embalagem de alta transparência 100% reciclável.',
    volume: '330g',
    hotspots: [
      {
        id: 'tampa',
        index: 1,
        title: 'Bico Dosador de Silicone',
        badge: 'Tecnologia Limpa',
        description: 'Válvula dosadora de silicone de precisão "Aperte e Não Pinga", proporcionando uso higiênico sem desperdícios.',
        position: [0, 0.23, 0.12],
        target: [0, 0.23, 0.0]
      },
      {
        id: 'ingredientes',
        index: 2,
        title: 'Ovos Caipiras & Óleos Sustentáveis',
        badge: 'Origem Ética',
        description: 'Ingredientes puros provenientes de fazendas com certificação de bem-estar animal e manejo regenerativo.',
        position: [0.15, 0.02, 0.13],
        target: [0.08, 0.02, 0.0]
      },
      {
        id: 'reciclagem',
        index: 3,
        title: 'Pote 100% PET Reciclado',
        badge: 'Sustentabilidade',
        description: 'Pote transparente em PET grau alimentício 100% reciclado, preservando o sabor e poupando recursos naturais.',
        position: [-0.15, -0.16, 0.12],
        target: [-0.08, -0.16, 0.0]
      }
    ]
  }
]
