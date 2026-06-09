# lista-smart-backend

Backend do sistema de recomendação personalizada para o app mobile **Lista Smart**, desenvolvido como trabalho acadêmico de Desenvolvimento Mobile.

O objetivo é demonstrar que diferentes comportamentos geram diferentes recomendações — sem banco de dados, sem machine learning, usando heurísticas simples inspiradas em marketplaces reais.

---

## Requisitos

- Node.js 18+
- pnpm (ou npm)

---

## Instalação e execução

```bash
pnpm install
pnpm start:dev
```

O servidor sobe em `http://localhost:3000`.

---

## Visualizador interativo

Com o servidor rodando, acesse **`http://localhost:3000`** no browser para abrir o painel de visualização da memória interna.

O dashboard exibe em tempo real (polling a cada 2 segundos) o estado completo do backend:

| Seção | O que mostra |
|-------|-------------|
| **Pipeline de eventos** | Fluxo animado das 5 etapas: requisição → evento → memória → algoritmo → resposta |
| **Memória em tempo real** | Contadores de eventos, itens na lista e produtos no catálogo |
| **Algoritmos** | Saída ao vivo dos 5 algoritmos de recomendação para o usuário selecionado |
| **Matriz de co-ocorrência** | Pares de produtos que aparecem juntos nas listas, com barras de frequência |
| **Log de eventos** | Histórico cronológico de todos os eventos registrados |
| **Carrinhos virtuais** | Agrupamento de ADD_TO_LIST por usuário (base do algoritmo de co-ocorrência) |

Use os botões de usuário (1–4) para alternar o contexto e observar como as recomendações mudam conforme o histórico de cada usuário.

O botão **Resetar Memória** chama `POST /debug/reset` e zera todos os arrays — útil para recomeçar uma demonstração do zero sem reiniciar o servidor.

---

## Testando manualmente

### Seed de dados

Com o servidor rodando, execute o script de seed para popular a memória com eventos e verificar todos os endpoints de uma vez:

```bash
node seed.js
```

O script cria visualizações, adições à lista e compras para vários usuários simulados, depois imprime o resultado de cada endpoint.

> A memória é zerada sempre que o servidor reinicia. Rode o seed novamente após cada restart.

### Testando endpoints individualmente

Todos os exemplos usam `curl`. O header `user-id` identifica o usuário — não há autenticação.

#### Produtos

```bash
# Listar todos os produtos
curl http://localhost:3000/products

# Ver detalhes de um produto (registra evento PRODUCT_VIEW para o user 1)
curl -H "user-id: 1" http://localhost:3000/products/1
```

#### Lista de compras

```bash
# Adicionar produto à lista (registra evento ADD_TO_LIST)
curl -X POST http://localhost:3000/shopping-list/items \
  -H "Content-Type: application/json" \
  -H "user-id: 1" \
  -d '{"productId": 42}'

# Ver todos os itens da lista
curl http://localhost:3000/shopping-list/items

# Ver sugestões baseadas na lista atual do usuário
curl -H "user-id: 1" http://localhost:3000/shopping-list/suggestions
```

#### Compras

```bash
# Registrar uma compra (registra evento PURCHASE)
curl -X POST http://localhost:3000/purchases \
  -H "Content-Type: application/json" \
  -H "user-id: 1" \
  -d '{"productId": 1}'
```

#### Recomendações

```bash
# Recomendação personalizada por categoria favorita (score híbrido)
curl -H "user-id: 1" http://localhost:3000/recommendations

# Produtos em alta globalmente (mais adicionados às listas)
curl http://localhost:3000/recommendations/trending

# Produtos para recompra (baseado em compras passadas)
curl -H "user-id: 1" http://localhost:3000/recommendations/restock

# Produtos relacionados a um produto específico (co-ocorrência)
curl http://localhost:3000/products/42/recommendations
```

#### Debug / métricas

```bash
# Todos os eventos registrados
curl http://localhost:3000/events

# Views por produto
curl http://localhost:3000/stats/products

# Views por categoria
curl http://localhost:3000/stats/categories

# Adições à lista por produto
curl http://localhost:3000/stats/add-to-list
```

---

## O que o sistema contempla

### Eventos de comportamento

Toda interação do usuário gera um evento em memória. Cada tipo tem um peso diferente no algoritmo de recomendação:

| Evento | Gerado quando | Peso |
|--------|--------------|------|
| `PRODUCT_VIEW` | Usuário abre a tela de detalhes de um produto | 1 |
| `ADD_TO_LIST` | Usuário adiciona produto à lista de compras | 3 |
| `PURCHASE` | Usuário registra uma compra | usado no restock |

### Algoritmos de recomendação

**1. Personalizada por categoria** — `GET /recommendations`
Calcula a categoria favorita do usuário somando os pesos dos eventos (`VIEW × 1 + ADD_TO_LIST × 3`). Retorna produtos dessa categoria que o usuário ainda não interagiu.

**2. Produtos relacionados** — `GET /products/:id/recommendations`
Co-ocorrência: agrupa os eventos `ADD_TO_LIST` por usuário e conta quantas vezes dois produtos aparecem juntos. Retorna os mais frequentes.

**3. Sugestões para a lista** — `GET /shopping-list/suggestions`
Aplica a mesma co-ocorrência sobre todos os itens da lista atual do usuário. Exemplo: lista tem Arroz → sugere Feijão, Óleo, Macarrão.

**4. Trending** — `GET /recommendations/trending`
Os 10 produtos mais adicionados às listas globalmente (últimos 50 eventos `ADD_TO_LIST`). Não é personalizado — útil para a tela inicial.

**5. Restock** — `GET /recommendations/restock`
Para cada produto comprado pelo usuário, calcula o tempo desde a última compra e compara com o intervalo estimado de consumo da categoria:

| Categoria | Intervalo |
|-----------|-----------|
| Laticínios, Hortifruti, Carnes, Padaria | 7 dias |
| Bebidas, Congelados | 14 dias |
| Limpeza, Higiene, Mercearia | 30 dias |

---

## Integração com o frontend (React Native)

### Base URL

```ts
const API_URL = 'http://localhost:3000'; // dev local
```

Em produção ou testes em dispositivo físico, substituir pelo IP da máquina na rede local (ex: `http://192.168.1.10:3000`).

### Identificação do usuário

Não há autenticação. Toda requisição personalizada passa o `userId` via header:

```ts
const headers = {
  'Content-Type': 'application/json',
  'user-id': String(userId),
};
```

Para o app mobile, um `userId` fixo por dispositivo já é suficiente para demonstração. Pode ser gerado uma vez e salvo com `AsyncStorage`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

async function getUserId(): Promise<string> {
  let id = await AsyncStorage.getItem('userId');
  if (!id) {
    id = String(Math.floor(Math.random() * 9000) + 1000);
    await AsyncStorage.setItem('userId', id);
  }
  return id;
}
```

### Mapeamento de telas para endpoints

| Tela | Endpoint | Observações |
|------|----------|-------------|
| Home | `GET /recommendations/trending` | Seção "Em alta" |
| Home | `GET /recommendations` | Seção "Para você" (precisa do `user-id`) |
| Detalhes do produto | `GET /products/:id` | Passa `user-id` para registrar o VIEW |
| Detalhes do produto | `GET /products/:id/recommendations` | Seção "Quem viu também comprou" |
| Lista de compras | `POST /shopping-list/items` | Botão "Adicionar à lista" |
| Lista de compras | `GET /shopping-list/suggestions` | Seção "Adicionar também" |
| Finalizar compra | `POST /purchases` | Uma chamada por produto comprado |
| Home / notificação | `GET /recommendations/restock` | Seção "Está acabando?" |

### Exemplo de chamada

```ts
// Buscar recomendações personalizadas
async function fetchRecommendations(userId: string) {
  const res = await fetch(`${API_URL}/recommendations`, {
    headers: { 'user-id': userId },
  });
  return res.json(); // Product[]
}

// Adicionar produto à lista
async function addToList(userId: string, productId: number) {
  const res = await fetch(`${API_URL}/shopping-list/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-id': userId,
    },
    body: JSON.stringify({ productId }),
  });
  return res.json(); // ShoppingListItem
}
```

### Tipos TypeScript

```ts
interface Product {
  id: number;
  name: string;
  category: string;
  brand: string;
  price: number;
  imageUrl: string;
  tags: string[];
}

interface ShoppingListItem {
  id: number;
  userId: number;
  productId: number;
  addedAt: string;
}
```
