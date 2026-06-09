const BASE = 'http://localhost:3000';

async function get(path, userId) {
  const headers = userId ? { 'user-id': String(userId) } : {};
  const res = await fetch(`${BASE}${path}`, { headers });
  return res.json();
}

async function post(path, body, userId) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'user-id': String(userId) },
    body: JSON.stringify(body),
  });
  return res.json();
}

function section(title) {
  console.log(`\n${'='.repeat(55)}`);
  console.log(` ${title}`);
  console.log('='.repeat(55));
}

function print(label, data) {
  console.log(`\n[${label}]`);
  console.log(JSON.stringify(data, null, 2));
}

async function seed() {
  section('SEED — Visualizações (PRODUCT_VIEW)');

  // Usuário 1 visualiza Laticínios (ids 1-4)
  for (const id of [1, 2, 3, 4]) {
    await get(`/products/${id}`, 1);
    console.log(`  user 1 → VIEW produto ${id}`);
  }

  // Usuário 2 visualiza Bebidas (ids 7-9) + ADD_TO_LIST cerveja (id 10)
  for (const id of [7, 8, 9]) {
    await get(`/products/${id}`, 2);
    console.log(`  user 2 → VIEW produto ${id}`);
  }

  // Usuário 3 visualiza Mercearia (ids 42-44)
  for (const id of [42, 43, 44]) {
    await get(`/products/${id}`, 3);
    console.log(`  user 3 → VIEW produto ${id}`);
  }

  section('SEED — Adições à lista (ADD_TO_LIST, peso 3)');

  // Usuário 1: adiciona Laticínios → peso 3 reforça preferência por Laticínios
  for (const id of [1, 3]) {
    await post('/shopping-list/items', { productId: id }, 1);
    console.log(`  user 1 → ADD produto ${id}`);
  }

  // Vários usuários adicionam Arroz+Feijão+Óleo → co-ocorrência alta
  for (const userId of [1, 2, 3, 4, 5]) {
    for (const id of [42, 43, 46]) {
      await post('/shopping-list/items', { productId: id }, userId);
    }
    console.log(`  user ${userId} → ADD Arroz(42) + Feijão(43) + Óleo(46)`);
  }

  // Alguns adicionam Macarrão também
  for (const userId of [1, 2, 3]) {
    await post('/shopping-list/items', { productId: 44 }, userId);
    console.log(`  user ${userId} → ADD Macarrão(44)`);
  }

  // Usuários 6 e 7: combo Carnes + Congelados
  for (const userId of [6, 7]) {
    for (const id of [33, 38, 41]) {
      await post('/shopping-list/items', { productId: id }, userId);
    }
    console.log(`  user ${userId} → ADD Frango(33) + Pizza(38) + Batata(41)`);
  }

  section('SEED — Compras (PURCHASE)');

  // Usuário 1 comprou Leite e Iogurte (agora, portanto restock ainda não vencido)
  for (const id of [1, 3]) {
    await post('/purchases', { productId: id }, 1);
    console.log(`  user 1 → PURCHASE produto ${id}`);
  }

  // Usuário 2 comprou Cerveja
  await post('/purchases', { productId: 10 }, 2);
  console.log(`  user 2 → PURCHASE produto 10`);

  section('TESTE — Contagem de eventos');
  const allEvents = await get('/events');
  const counts = allEvents.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`  total: ${allEvents.length}`);
  print('por tipo', counts);

  section('TESTE — GET /recommendations (score híbrido)');
  for (const userId of [1, 2, 3]) {
    const recs = await get('/recommendations', userId);
    console.log(`\n  user ${userId} → ${recs.length} recomendações`);
    recs.slice(0, 3).forEach((p) =>
      console.log(`    - [${p.category}] ${p.name}`),
    );
  }

  section('TESTE — GET /recommendations/trending');
  const trending = await get('/recommendations/trending');
  console.log(`\n  top 5 trending:`);
  trending.slice(0, 5).forEach((p) => console.log(`    - ${p.name} (id ${p.id})`));

  section('TESTE — GET /recommendations/restock');
  console.log('\n  user 1 (comprou Leite e Iogurte agora → ainda não vencido):');
  const restock1 = await get('/recommendations/restock', 1);
  console.log(`    resultado: ${restock1.length} produto(s) para recompra`);
  console.log('  (restock aparece após o intervalo da categoria: Laticínios = 7 dias)');

  section('TESTE — GET /products/:id/recommendations (co-ocorrência)');
  console.log('\n  Arroz (42) → esperado: Feijão, Óleo, Macarrão');
  const relArroz = await get('/products/42/recommendations');
  relArroz.slice(0, 4).forEach((p) => console.log(`    - ${p.name} (id ${p.id})`));

  console.log('\n  Frango (33) → esperado: Pizza, Batata Palito');
  const relFrango = await get('/products/33/recommendations');
  relFrango.slice(0, 3).forEach((p) => console.log(`    - ${p.name} (id ${p.id})`));

  section('SEED — Lista parcial para testar suggestions');
  // user 10 adiciona só Arroz → suggestions deve sugerir Feijão, Óleo, Macarrão
  await post('/shopping-list/items', { productId: 42 }, 10);
  console.log('  user 10 → ADD só Arroz(42)');

  section('TESTE — GET /shopping-list/suggestions');
  console.log('\n  user 10 tem só Arroz → espera Feijão, Óleo, Macarrão');
  const suggestions = await get('/shopping-list/suggestions', 10);
  suggestions.slice(0, 5).forEach((p) =>
    console.log(`    - ${p.name} (id ${p.id})`),
  );

  section('TESTE — GET /stats');
  print('views por categoria', await get('/stats/categories'));
  print('add-to-list por produto', await get('/stats/add-to-list'));

  console.log('\n✓ Seed e testes concluídos.\n');
}

seed().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
