// ==========================================
// DASHBOARD COMPLETO - Studio DeVitto
// ==========================================
// Salve este arquivo como: dashboard.js
// Importe no seu sistema principal:
// <script src="dashboard.js"></script>
// 
// Para carregar o dashboard, chame:
// window.carregarDashboard();
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // 1. VARIÁVEIS GLOBAIS
    // ==========================================
    let dashboardData = {
        services: [],
        productSales: [],
        clients: [],
        collaborators: [],
        products: [],
        appointments: [],
        cashier: null,
        notes: [],
        payments: []
    };

    let dashboardChart = null;
    let periodoInicio = null;
    let periodoFim = null;

    // ==========================================
    // 2. FUNÇÃO PRINCIPAL - CARREGAR DASHBOARD
    // ==========================================
    window.carregarDashboard = function() {
        console.log('📊 Carregando Dashboard...');
        
        // Verificar se a seção dashboard existe
        let dashboardSection = document.getElementById('dashboard');
        if (!dashboardSection) {
            console.log('⚠️ Seção Dashboard não encontrada, criando...');
            criarSecaoDashboard();
            dashboardSection = document.getElementById('dashboard');
        }

        // Carregar dados
        carregarDadosDashboard().then(() => {
            renderizarDashboard();
        });

        // Configurar eventos
        configurarEventos();
    };

    // ==========================================
    // 3. CRIAR SEÇÃO DASHBOARD
    // ==========================================
    function criarSecaoDashboard() {
        const container = document.querySelector('.section-container');
        if (!container) {
            console.error('❌ Container .section-container não encontrado');
            return;
        }

        container.insertAdjacentHTML('beforeend', `
            <div id="dashboard" class="section">
                <!-- Conteúdo será renderizado aqui -->
                <div id="dashboardContent">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-3 text-muted">Carregando dashboard...</p>
                    </div>
                </div>
            </div>
        `);

        console.log('✅ Seção Dashboard criada');
    }

    // ==========================================
    // 4. CARREGAR DADOS
    // ==========================================
    async function carregarDadosDashboard() {
        try {
            // Tentar carregar do Firebase
            if (window.db && window.currentUser) {
                await carregarDoFirebase();
            } else {
                // Fallback: localStorage
                carregarDoLocalStorage();
            }
            
            // Carregar notas e pagamentos
            carregarNotasEPagamentos();
            
            console.log('✅ Dados do dashboard carregados');
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            carregarDoLocalStorage();
        }
    }

    async function carregarDoFirebase() {
        const db = window.db;
        const uid = window.currentUser.uid;

        // Serviços
        const servicesSnap = await db.collection('services').where('userId', '==', uid).get();
        dashboardData.services = [];
        servicesSnap.forEach(doc => dashboardData.services.push({ id: doc.id, ...doc.data() }));

        // Vendas de produtos
        const salesSnap = await db.collection('productSales').where('userId', '==', uid).get();
        dashboardData.productSales = [];
        salesSnap.forEach(doc => dashboardData.productSales.push({ id: doc.id, ...doc.data() }));

        // Clientes
        const clientsSnap = await db.collection('clients').where('userId', '==', uid).get();
        dashboardData.clients = [];
        clientsSnap.forEach(doc => dashboardData.clients.push({ id: doc.id, ...doc.data() }));

        // Colaboradores
        const collabSnap = await db.collection('collaborators').where('userId', '==', uid).get();
        dashboardData.collaborators = [];
        collabSnap.forEach(doc => dashboardData.collaborators.push({ id: doc.id, ...doc.data() }));

        // Produtos
        const productsSnap = await db.collection('products').where('userId', '==', uid).get();
        dashboardData.products = [];
        productsSnap.forEach(doc => dashboardData.products.push({ id: doc.id, ...doc.data() }));

        // Agendamentos
        const appSnap = await db.collection('appointments').where('userId', '==', uid).get();
        dashboardData.appointments = [];
        appSnap.forEach(doc => dashboardData.appointments.push({ id: doc.id, ...doc.data() }));

        // Salvar no localStorage
        salvarNoLocalStorage();
    }

    function carregarDoLocalStorage() {
        try {
            const keys = ['services', 'productSales', 'clients', 'collaborators', 'products', 'appointments'];
            keys.forEach(key => {
                const data = localStorage.getItem(`dashboard_${key}`);
                if (data) {
                    dashboardData[key] = JSON.parse(data);
                }
            });
        } catch(e) {
            console.warn('Erro ao carregar do localStorage:', e);
        }
    }

    function salvarNoLocalStorage() {
        try {
            Object.keys(dashboardData).forEach(key => {
                if (key !== 'notes' && key !== 'payments' && key !== 'cashier') {
                    localStorage.setItem(`dashboard_${key}`, JSON.stringify(dashboardData[key]));
                }
            });
        } catch(e) {}
    }

    // ==========================================
    // 5. NOTAS E PAGAMENTOS
    // ==========================================
    function carregarNotasEPagamentos() {
        try {
            const notas = localStorage.getItem('dashboard_notes');
            dashboardData.notes = notas ? JSON.parse(notas) : [];

            const pagamentos = localStorage.getItem('dashboard_payments');
            dashboardData.payments = pagamentos ? JSON.parse(pagamentos) : [];
        } catch(e) {
            dashboardData.notes = [];
            dashboardData.payments = [];
        }
    }

    function salvarNotasEPagamentos() {
        try {
            localStorage.setItem('dashboard_notes', JSON.stringify(dashboardData.notes));
            localStorage.setItem('dashboard_payments', JSON.stringify(dashboardData.payments));
        } catch(e) {}
    }

    // ==========================================
    // 6. RENDERIZAR DASHBOARD
    // ==========================================
    function renderizarDashboard() {
        const container = document.getElementById('dashboardContent');
        if (!container) return;

        const html = gerarHTMLDashboard();
        container.innerHTML = html;

        // Renderizar gráfico
        setTimeout(() => {
            renderizarGrafico();
            // Adicionar eventos após renderizar
            adicionarEventosDinamicos();
        }, 100);
    }

    // ==========================================
    // 7. GERAR HTML DO DASHBOARD
    // ==========================================
    function gerarHTMLDashboard() {
        const hoje = new Date();
        const hojeStr = hoje.toISOString().split('T')[0];
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        // Período selecionado
        const dataInicio = periodoInicio || inicioMes;
        const dataFim = periodoFim || hoje;

        // Filtrar serviços pelo período
        const servicosPeriodo = filtrarServicosPorPeriodo(dataInicio, dataFim);
        const vendasPeriodo = filtrarVendasPorPeriodo(dataInicio, dataFim);

        // Calcular totais do período
        const totaisPeriodo = calcularTotaisPeriodo(servicosPeriodo, vendasPeriodo);

        // Serviços de hoje
        const servicosHoje = dashboardData.services.filter(s => s.date === hojeStr);

        // Aniversários
        const aniversarios = getProximosAniversarios();

        // Estatísticas dos funcionários
        const statsColaboradores = dashboardData.collaborators
            .filter(c => c.active !== false)
            .map(c => ({
                ...c,
                stats: calcularEstatisticasCompletas(c.id, dataInicio, dataFim)
            }))
            .sort((a, b) => b.stats.totalBruto - a.stats.totalBruto);

        // Notas recentes
        const notasRecentes = dashboardData.notes.slice(-5).reverse();

        // Pagamentos recentes
        const pagamentosRecentes = dashboardData.payments.slice(-5).reverse();

        return `
            <!-- CABEÇALHO -->
            <div class="dashboard-header">
                <div class="d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                        <h1><i class="fas fa-tachometer-alt me-2"></i>Dashboard</h1>
                        <p class="text-muted mb-0">
                            <i class="fas fa-calendar-alt me-1"></i>
                            ${formatDate(dataInicio)} - ${formatDate(dataFim)}
                        </p>
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="window.abrirCalendarioPeriodo()">
                            <i class="fas fa-calendar-alt me-1"></i>Selecionar Período
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="window.limparPeriodo()">
                            <i class="fas fa-undo me-1"></i>Limpar Filtro
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="window.recarregarDashboard()">
                            <i class="fas fa-sync-alt me-1"></i>Atualizar
                        </button>
                    </div>
                </div>
                <div class="row g-2 mt-3">
                    <div class="col-md-3 col-6">
                        <div class="stats-mini-card">
                            <div class="label">Total Bruto</div>
                            <div class="value">${formatCurrency(totaisPeriodo.totalBruto)}</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="stats-mini-card">
                            <div class="label">Comissões</div>
                            <div class="value text-warning">${formatCurrency(totaisPeriodo.totalComissoes)}</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="stats-mini-card">
                            <div class="label">Salão</div>
                            <div class="value text-success">${formatCurrency(totaisPeriodo.totalSalao)}</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="stats-mini-card">
                            <div class="label">Serviços</div>
                            <div class="value">${servicosPeriodo.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CARDS DE MÉTRICAS RÁPIDAS -->
            <div class="row g-3 mb-4">
                <div class="col-lg-3 col-md-6 col-12">
                    <div class="metric-card" style="border-left-color: #28a745;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <div class="metric-label">Hoje (Serviços)</div>
                                <div class="metric-value text-success">${formatCurrency(calcularTotalServicos(servicosHoje))}</div>
                                <div class="metric-sub">${servicosHoje.length} serviços</div>
                            </div>
                            <div class="metric-icon green"><i class="fas fa-calendar-day"></i></div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 col-12">
                    <div class="metric-card" style="border-left-color: #17a2b8;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <div class="metric-label">Produtos Hoje</div>
                                <div class="metric-value text-info">${formatCurrency(calcularTotalProdutosHoje())}</div>
                                <div class="metric-sub">${dashboardData.productSales.filter(s => s.date === hojeStr).length} produtos</div>
                            </div>
                            <div class="metric-icon blue"><i class="fas fa-shopping-bag"></i></div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 col-12">
                    <div class="metric-card" style="border-left-color: #ffc107;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <div class="metric-label">Aniversários</div>
                                <div class="metric-value text-warning">${aniversarios.length}</div>
                                <div class="metric-sub">Próximos 7 dias</div>
                            </div>
                            <div class="metric-icon gold"><i class="fas fa-birthday-cake"></i></div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 col-12">
                    <div class="metric-card" style="border-left-color: #26196b;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <div class="metric-label">Clientes</div>
                                <div class="metric-value">${dashboardData.clients.length}</div>
                                <div class="metric-sub">Cadastrados</div>
                            </div>
                            <div class="metric-icon purple"><i class="fas fa-users"></i></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- GRÁFICO -->
            <div class="row g-3 mb-4">
                <div class="col-lg-8">
                    <div class="chart-container">
                        <h6><i class="fas fa-chart-bar me-2"></i>Vendas - Serviços vs Produtos</h6>
                        <canvas id="dashboardChart"></canvas>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card-custom">
                        <h6 class="fw-bold text-primary mb-3"><i class="fas fa-clock me-2"></i>Serviços Recentes</h6>
                        <div id="recentServices" style="max-height:230px;overflow-y:auto;">
                            ${servicosHoje.slice(0, 5).map(s => {
                                const client = dashboardData.clients.find(c => c.id === s.clientId);
                                return `
                                    <div class="recent-service-item">
                                        <div>
                                            <div class="fw-semibold fs-small">${s.description || 'Serviço'}</div>
                                            <div class="text-muted fs-small">${client ? client.name : 'Cliente'}</div>
                                        </div>
                                        <div class="fw-bold text-primary">${formatCurrency(s.value)}</div>
                                    </div>
                                `;
                            }).join('') || '<p class="text-muted text-center py-3">Nenhum serviço hoje</p>'}
                        </div>
                    </div>
                </div>
            </div>

            <!-- DESEMPENHO DOS FUNCIONÁRIOS -->
            <h6 class="fw-bold text-primary mb-3"><i class="fas fa-user-friends me-2"></i>Desempenho dos Funcionários</h6>
            <div class="row g-3 mb-4" id="funcionariosCards">
                ${statsColaboradores.map((colab, index) => {
                    const cores = ['#f7971e', '#bdc3c7', '#cd7f32', '#667eea', '#764ba2', '#28a745', '#17a2b8', '#dc3545'];
                    const cor = cores[index % cores.length];
                    
                    const fotoHtml = colab.photoUrl ? 
                        `<img src="${colab.photoUrl}" class="avatar" onerror="this.style.display='none'">` :
                        `<div class="avatar-placeholder">${(colab.name || '?').charAt(0).toUpperCase()}</div>`;

                    return `
                        <div class="col-lg-4 col-md-6 col-12">
                            <div class="funcionario-card">
                                <div class="card-header-custom" style="background:linear-gradient(135deg, ${cor}, ${cor}dd);">
                                    ${fotoHtml}
                                    <h6>${colab.name}</h6>
                                    <small>${colab.specialty || 'Especialidade'}</small>
                                </div>
                                <div class="card-body-custom">
                                    <div class="stat-row">
                                        <span class="label">Comissão</span>
                                        <span class="value">${colab.manualPercent || 0}%</span>
                                    </div>
                                    <div class="stat-row">
                                        <span class="label">Serviços</span>
                                        <span class="value">${colab.stats.totalServicos}</span>
                                    </div>
                                    <div class="stat-row">
                                        <span class="label">Total Bruto</span>
                                        <span class="value positive">${formatCurrency(colab.stats.totalBruto)}</span>
                                    </div>
                                    <div class="stat-row">
                                        <span class="label">Comissão</span>
                                        <span class="value">${formatCurrency(colab.stats.totalComissao)}</span>
                                    </div>
                                    <div class="stat-row" style="border-bottom:none;">
                                        <span class="label">Salão</span>
                                        <span class="value positive">${formatCurrency(colab.stats.totalSalao)}</span>
                                    </div>
                                    <div class="d-flex justify-content-between fs-small text-muted mt-2">
                                        <span>Hoje: ${formatCurrency(colab.stats.hojeBruto)}</span>
                                        <span>Semana: ${formatCurrency(colab.stats.semanaBruto)}</span>
                                        <span>Mês: ${formatCurrency(colab.stats.mesBruto)}</span>
                                    </div>
                                    <div class="progress-custom">
                                        <div class="bar salao" style="width:${100 - (colab.manualPercent || 0)}%;"></div>
                                        <div class="bar comissao" style="width:${colab.manualPercent || 0}%;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') || '<div class="col-12 text-center text-muted py-4">Nenhum funcionário ativo</div>'}
            </div>

            <!-- ANIVERSÁRIOS -->
            <div class="card-custom mb-4">
                <h6 class="fw-bold text-primary mb-3"><i class="fas fa-birthday-cake me-2"></i>Próximos Aniversários</h6>
                <div id="birthdayList">
                    ${aniversarios.length > 0 ? aniversarios.map(c => {
                        const isToday = isAniversarioHoje(c.birthdate);
                        return `
                            <div class="birthday-item ${isToday ? 'birthday-today' : ''}" onclick="window.verCliente('${c.id}')">
                                ${c.photoUrl ? `<img src="${c.photoUrl}" class="avatar">` : `<div class="avatar-placeholder">${(c.name || '?').charAt(0).toUpperCase()}</div>`}
                                <div class="info">
                                    <div class="name">${c.name}</div>
                                    <div class="date">${formatDate(c.birthdate)}</div>
                                </div>
                                <span class="${isToday ? 'badge-today' : 'badge-soon'}">
                                    ${isToday ? '🎉 HOJE!' : `${diasAteAniversario(c.birthdate)} dias`}
                                </span>
                            </div>
                        `;
                    }).join('') : '<p class="text-muted text-center py-3">Nenhum aniversário próximo</p>'}
                </div>
            </div>

            <!-- NOTAS E PAGAMENTOS -->
            <div class="row g-3">
                <!-- NOTAS -->
                <div class="col-md-6">
                    <div class="card-custom">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="fw-bold text-primary mb-0"><i class="fas fa-sticky-note me-2"></i>Notas</h6>
                            <button class="btn btn-sm btn-primary" onclick="window.abrirModalNota()">
                                <i class="fas fa-plus me-1"></i>Adicionar
                            </button>
                        </div>
                        <div id="notesList" style="max-height:250px;overflow-y:auto;">
                            ${notasRecentes.map(nota => `
                                <div class="note-item ${nota.tipo === 'pagamento' ? 'note-payment' : ''}">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div>
                                            <div class="fw-semibold fs-small">${nota.texto}</div>
                                            <div class="fs-small text-muted">
                                                <i class="fas fa-user me-1"></i>${nota.clienteNome || 'Cliente'}
                                                ${nota.colaboradorNome ? `| <i class="fas fa-user-tie me-1"></i>${nota.colaboradorNome}` : ''}
                                                ${nota.valor ? `| ${formatCurrency(nota.valor)}` : ''}
                                            </div>
                                            <div class="fs-small text-muted">${formatDate(nota.data)}</div>
                                        </div>
                                        <button class="btn btn-sm btn-outline-danger" onclick="window.removerNota('${nota.id}')">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('') || '<p class="text-muted text-center py-3">Nenhuma nota</p>'}
                        </div>
                    </div>
                </div>

                <!-- PAGAMENTOS -->
                <div class="col-md-6">
                    <div class="card-custom">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="fw-bold text-primary mb-0"><i class="fas fa-money-bill-wave me-2"></i>Pagamentos</h6>
                            <button class="btn btn-sm btn-success" onclick="window.abrirModalPagamento()">
                                <i class="fas fa-plus me-1"></i>Registrar
                            </button>
                        </div>
                        <div id="paymentsList" style="max-height:250px;overflow-y:auto;">
                            ${pagamentosRecentes.map(p => `
                                <div class="payment-item">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div>
                                            <div class="fw-semibold fs-small">
                                                ${p.clienteNome} → ${p.colaboradorNome}
                                            </div>
                                            <div class="fs-small text-muted">
                                                <span class="text-danger fw-bold">${formatCurrency(p.valor)}</span>
                                                ${p.descricao ? `| ${p.descricao}` : ''}
                                            </div>
                                            <div class="fs-small text-muted">${formatDate(p.data)}</div>
                                        </div>
                                        <button class="btn btn-sm btn-outline-danger" onclick="window.removerPagamento('${p.id}')">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('') || '<p class="text-muted text-center py-3">Nenhum pagamento</p>'}
                        </div>
                    </div>
                </div>
            </div>

            <!-- PRÓXIMAS MARCAÇÕES -->
            <div class="card-custom mt-3">
                <h6 class="fw-bold text-primary mb-3"><i class="fas fa-calendar-check me-2"></i>Próximas Marcações</h6>
                <div id="upcomingAppointments">
                    ${dashboardData.appointments
                        .filter(a => a.status !== 'completed' && a.status !== 'cancelled')
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .slice(0, 5)
                        .map(a => {
                            const client = dashboardData.clients.find(c => c.id === a.clientId);
                            return `
                                <div class="appointment-item">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div class="fw-semibold fs-small">${client ? client.name : 'Cliente'}</div>
                                            <div class="fs-small text-muted">
                                                <i class="fas fa-calendar me-1"></i>${formatDate(a.date)} 
                                                <i class="fas fa-clock ms-2 me-1"></i>${a.startTime || '--:--'}
                                                ${a.serviceName ? `| ${a.serviceName}` : ''}
                                            </div>
                                        </div>
                                        <span class="badge ${a.status === 'confirmed' ? 'bg-success' : 'bg-warning'}">
                                            ${a.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>
                            `;
                        }).join('') || '<p class="text-muted text-center py-3">Nenhuma marcação futura</p>'}
                </div>
            </div>
        `;
    }

    // ==========================================
    // 8. FUNÇÕES DE CÁLCULO
    // ==========================================
    function filtrarServicosPorPeriodo(inicio, fim) {
        return dashboardData.services.filter(s => {
            if (!s.date) return false;
            const data = new Date(s.date);
            return data >= inicio && data <= fim;
        });
    }

    function filtrarVendasPorPeriodo(inicio, fim) {
        return dashboardData.productSales.filter(s => {
            if (!s.date) return false;
            const data = new Date(s.date);
            return data >= inicio && data <= fim;
        });
    }

    function calcularTotaisPeriodo(servicos, vendas) {
        let totalBruto = 0;
        let totalComissoes = 0;
        let totalSalao = 0;

        servicos.forEach(s => {
            const valor = parseFloat(s.value || 0);
            totalBruto += valor;
            
            const colab = dashboardData.collaborators.find(c => c.id === s.collaboratorId);
            let perc = 0;
            if (colab) {
                if (s.type === 'manual') perc = parseFloat(colab.manualPercent) || 0;
                else if (s.type === 'product') perc = parseFloat(colab.productPercent) || 0;
            }
            totalComissoes += valor * (perc / 100);
            totalSalao += valor * ((100 - perc) / 100);
        });

        // Adicionar vendas de produtos (100% para o salão)
        vendas.forEach(v => {
            totalBruto += parseFloat(v.totalValue || 0);
            totalSalao += parseFloat(v.totalValue || 0);
        });

        return { totalBruto, totalComissoes, totalSalao };
    }

    function calcularEstatisticasCompletas(colaboradorId, inicio, fim) {
        const servicos = dashboardData.services.filter(s => 
            s.collaboratorId === colaboradorId && s.date
        );

        const hoje = new Date();
        const hojeStr = hoje.toISOString().split('T')[0];
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay() + (hoje.getDay() === 0 ? -6 : 1));
        inicioSemana.setHours(0,0,0,0);
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

        let totalBruto = 0, totalComissao = 0, totalSalao = 0;
        let hojeBruto = 0, semanaBruto = 0, mesBruto = 0;
        let totalServicos = 0;

        const colab = dashboardData.collaborators.find(c => c.id === colaboradorId);

        servicos.forEach(s => {
            const valor = parseFloat(s.value || 0);
            const data = new Date(s.date);
            
            totalBruto += valor;
            totalServicos++;

            let perc = 0;
            if (colab) {
                if (s.type === 'manual') perc = parseFloat(colab.manualPercent) || 0;
                else if (s.type === 'product') perc = parseFloat(colab.productPercent) || 0;
            }
            totalComissao += valor * (perc / 100);
            totalSalao += valor * ((100 - perc) / 100);

            // Hoje
            if (s.date === hojeStr) hojeBruto += valor;
            
            // Semana
            if (data >= inicioSemana) semanaBruto += valor;
            
            // Mês
            if (data >= inicioMes) mesBruto += valor;
        });

        return {
            totalBruto,
            totalComissao,
            totalSalao,
            totalServicos,
            hojeBruto,
            semanaBruto,
            mesBruto
        };
    }

    function calcularTotalServicos(servicos) {
        return servicos.reduce((sum, s) => sum + parseFloat(s.value || 0), 0);
    }

    function calcularTotalProdutosHoje() {
        const hoje = new Date().toISOString().split('T')[0];
        return dashboardData.productSales
            .filter(s => s.date === hoje)
            .reduce((sum, s) => sum + parseFloat(s.totalValue || 0), 0);
    }

    // ==========================================
    // 9. ANIVERSÁRIOS
    // ==========================================
    function getProximosAniversarios() {
        const hoje = new Date();
        const hojeMonth = hoje.getMonth();
        const hojeDay = hoje.getDate();

        return dashboardData.clients.filter(c => {
            if (!c.birthdate) return false;
            const birth = new Date(c.birthdate);
            const month = birth.getMonth();
            const day = birth.getDate();

            if (month === hojeMonth && day === hojeDay) return true;

            const currentYear = hoje.getFullYear();
            let next = new Date(currentYear, month, day);
            if (next < hoje) next.setFullYear(currentYear + 1);
            
            const diff = Math.ceil((next - hoje) / (1000 * 60 * 60 * 24));
            return diff <= 7 && diff > 0;
        }).sort((a, b) => {
            const da = new Date(a.birthdate);
            const db = new Date(b.birthdate);
            const currentYear = hoje.getFullYear();
            let na = new Date(currentYear, da.getMonth(), da.getDate());
            let nb = new Date(currentYear, db.getMonth(), db.getDate());
            if (na < hoje) na.setFullYear(currentYear + 1);
            if (nb < hoje) nb.setFullYear(currentYear + 1);
            return na - nb;
        });
    }

    function isAniversarioHoje(birthdate) {
        if (!birthdate) return false;
        const hoje = new Date();
        const birth = new Date(birthdate);
        return birth.getMonth() === hoje.getMonth() && birth.getDate() === hoje.getDate();
    }

    function diasAteAniversario(birthdate) {
        if (!birthdate) return 0;
        const hoje = new Date();
        const birth = new Date(birthdate);
        const currentYear = hoje.getFullYear();
        let next = new Date(currentYear, birth.getMonth(), birth.getDate());
        if (next < hoje) next.setFullYear(currentYear + 1);
        return Math.ceil((next - hoje) / (1000 * 60 * 60 * 24));
    }

    // ==========================================
    // 10. GRÁFICO
    // ==========================================
    function renderizarGrafico() {
        const canvas = document.getElementById('dashboardChart');
        if (!canvas) return;

        const hoje = new Date();
        const currentYear = hoje.getFullYear();
        const currentMonth = hoje.getMonth();

        const labels = [];
        const servicesData = [];
        const productsData = [];

        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(currentYear, currentMonth - i, 1);
            labels.push(monthDate.toLocaleDateString('pt-PT', { month: 'short' }));

            const monthServices = dashboardData.services.filter(s => {
                if (!s.date) return false;
                const d = new Date(s.date);
                return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
            });
            servicesData.push(monthServices.reduce((sum, s) => sum + parseFloat(s.value || 0), 0));

            const monthProducts = dashboardData.productSales.filter(s => {
                if (!s.date) return false;
                const d = new Date(s.date);
                return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
            });
            productsData.push(monthProducts.reduce((sum, s) => sum + parseFloat(s.totalValue || 0), 0));
        }

        if (dashboardChart) dashboardChart.destroy();

        dashboardChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Serviços',
                        data: servicesData,
                        backgroundColor: '#26196b',
                        borderRadius: 4
                    },
                    {
                        label: 'Produtos',
                        data: productsData,
                        backgroundColor: '#17a2b8',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, padding: 15 } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: function(v) { return '€' + v; } }
                    }
                }
            }
        });
    }

    // ==========================================
    // 11. FUNÇÕES DE NOTAS E PAGAMENTOS
    // ==========================================
    window.abrirModalNota = function() {
        const clients = dashboardData.clients;
        const collaborators = dashboardData.collaborators.filter(c => c.active !== false);

        Swal.fire({
            title: 'Adicionar Nota',
            html: `
                <div class="mb-3">
                    <label class="form-label fw-bold">Tipo</label>
                    <select class="form-select" id="notaTipo">
                        <option value="geral">Geral</option>
                        <option value="pagamento">Pagamento</option>
                        <option value="observacao">Observação</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Cliente</label>
                    <select class="form-select" id="notaCliente">
                        <option value="">Selecione um cliente</option>
                        ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Colaborador</label>
                    <select class="form-select" id="notaColaborador">
                        <option value="">Selecione um colaborador</option>
                        ${collaborators.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Valor (€)</label>
                    <input type="number" class="form-control" id="notaValor" step="0.01" placeholder="0,00">
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Descrição / Nota</label>
                    <textarea class="form-control" id="notaTexto" rows="3" placeholder="Digite sua nota aqui..."></textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salvar Nota',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const tipo = document.getElementById('notaTipo').value;
                const clienteId = document.getElementById('notaCliente').value;
                const colaboradorId = document.getElementById('notaColaborador').value;
                const valor = parseFloat(document.getElementById('notaValor').value) || 0;
                const texto = document.getElementById('notaTexto').value.trim();

                if (!texto) {
                    Swal.showValidationMessage('Digite uma descrição para a nota');
                    return null;
                }

                const cliente = dashboardData.clients.find(c => c.id === clienteId);
                const colaborador = dashboardData.collaborators.find(c => c.id === colaboradorId);

                return {
                    id: 'nota_' + Date.now(),
                    tipo: tipo,
                    clienteId: clienteId,
                    clienteNome: cliente ? cliente.name : 'Cliente não selecionado',
                    colaboradorId: colaboradorId,
                    colaboradorNome: colaborador ? colaborador.name : '',
                    valor: valor,
                    texto: texto,
                    data: new Date().toISOString()
                };
            }
        }).then(result => {
            if (result.isConfirmed && result.value) {
                dashboardData.notes.push(result.value);
                salvarNotasEPagamentos();
                renderizarDashboard();
                Swal.fire('✅ Nota adicionada!', '', 'success');
            }
        });
    };

    window.abrirModalPagamento = function() {
        const clients = dashboardData.clients;
        const collaborators = dashboardData.collaborators.filter(c => c.active !== false);

        Swal.fire({
            title: 'Registrar Pagamento',
            html: `
                <div class="mb-3">
                    <label class="form-label fw-bold">Cliente *</label>
                    <select class="form-select" id="pagCliente" required>
                        <option value="">Selecione um cliente</option>
                        ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Colaborador *</label>
                    <select class="form-select" id="pagColaborador" required>
                        <option value="">Selecione um colaborador</option>
                        ${collaborators.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Valor (€) *</label>
                    <input type="number" class="form-control" id="pagValor" step="0.01" placeholder="0,00" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Descrição</label>
                    <input type="text" class="form-control" id="pagDescricao" placeholder="Ex: Pagamento de corte">
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Data do Pagamento</label>
                    <input type="date" class="form-control" id="pagData" value="${new Date().toISOString().split('T')[0]}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Registrar Pagamento',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const clienteId = document.getElementById('pagCliente').value;
                const colaboradorId = document.getElementById('pagColaborador').value;
                const valor = parseFloat(document.getElementById('pagValor').value);
                const descricao = document.getElementById('pagDescricao').value.trim();
                const data = document.getElementById('pagData').value;

                if (!clienteId) {
                    Swal.showValidationMessage('Selecione um cliente');
                    return null;
                }
                if (!colaboradorId) {
                    Swal.showValidationMessage('Selecione um colaborador');
                    return null;
                }
                if (!valor || valor <= 0) {
                    Swal.showValidationMessage('Digite um valor válido');
                    return null;
                }

                const cliente = dashboardData.clients.find(c => c.id === clienteId);
                const colaborador = dashboardData.collaborators.find(c => c.id === colaboradorId);

                return {
                    id: 'pag_' + Date.now(),
                    clienteId: clienteId,
                    clienteNome: cliente ? cliente.name : 'Cliente',
                    colaboradorId: colaboradorId,
                    colaboradorNome: colaborador ? colaborador.name : 'Colaborador',
                    valor: valor,
                    descricao: descricao,
                    data: data || new Date().toISOString()
                };
            }
        }).then(result => {
            if (result.isConfirmed && result.value) {
                dashboardData.payments.push(result.value);
                salvarNotasEPagamentos();
                
                // Também adicionar uma nota automática
                const cliente = dashboardData.clients.find(c => c.id === result.value.clienteId);
                const colaborador = dashboardData.collaborators.find(c => c.id === result.value.colaboradorId);
                
                dashboardData.notes.push({
                    id: 'nota_auto_' + Date.now(),
                    tipo: 'pagamento',
                    clienteId: result.value.clienteId,
                    clienteNome: cliente ? cliente.name : 'Cliente',
                    colaboradorId: result.value.colaboradorId,
                    colaboradorNome: colaborador ? colaborador.name : 'Colaborador',
                    valor: result.value.valor,
                    texto: `💸 Pagamento de ${formatCurrency(result.value.valor)} ${result.value.descricao ? `- ${result.value.descricao}` : ''}`,
                    data: result.value.data || new Date().toISOString(),
                    automatica: true
                });
                
                salvarNotasEPagamentos();
                renderizarDashboard();
                Swal.fire('✅ Pagamento registrado!', '', 'success');
            }
        });
    };

    window.removerNota = function(id) {
        Swal.fire({
            title: 'Remover nota?',
            text: 'Esta ação não pode ser desfeita.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, remover',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                dashboardData.notes = dashboardData.notes.filter(n => n.id !== id);
                salvarNotasEPagamentos();
                renderizarDashboard();
            }
        });
    };

    window.removerPagamento = function(id) {
        Swal.fire({
            title: 'Remover pagamento?',
            text: 'Esta ação não pode ser desfeita.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, remover',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                dashboardData.payments = dashboardData.payments.filter(p => p.id !== id);
                // Remover nota automática associada
                dashboardData.notes = dashboardData.notes.filter(n => 
                    !(n.automatica && n.valor === dashboardData.payments.find(p => p.id === id)?.valor)
                );
                salvarNotasEPagamentos();
                renderizarDashboard();
            }
        });
    };

    // ==========================================
    // 12. CALENDÁRIO DE PERÍODO
    // ==========================================
    window.abrirCalendarioPeriodo = function() {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        const inicioVal = periodoInicio ? periodoInicio.toISOString().split('T')[0] : inicioMes.toISOString().split('T')[0];
        const fimVal = periodoFim ? periodoFim.toISOString().split('T')[0] : hoje.toISOString().split('T')[0];

        Swal.fire({
            title: 'Selecionar Período',
            html: `
                <div class="row">
                    <div class="col-md-6">
                        <label class="form-label fw-bold">Data Início</label>
                        <input type="date" class="form-control" id="periodoInicio" value="${inicioVal}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">Data Fim</label>
                        <input type="date" class="form-control" id="periodoFim" value="${fimVal}">
                    </div>
                </div>
                <div class="mt-3 d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('periodoInicio').value='${inicioMes.toISOString().split('T')[0]}';document.getElementById('periodoFim').value='${hoje.toISOString().split('T')[0]}'">Este Mês</button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="const d=new Date();d.setMonth(d.getMonth()-1);document.getElementById('periodoInicio').value=d.toISOString().split('T')[0];document.getElementById('periodoFim').value='${hoje.toISOString().split('T')[0]}'">Último Mês</button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="const d=new Date();d.setFullYear(d.getFullYear()-1);document.getElementById('periodoInicio').value=d.toISOString().split('T')[0];document.getElementById('periodoFim').value='${hoje.toISOString().split('T')[0]}'">Último Ano</button>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Aplicar Filtro',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const inicio = document.getElementById('periodoInicio').value;
                const fim = document.getElementById('periodoFim').value;
                if (inicio && fim) {
                    if (new Date(inicio) > new Date(fim)) {
                        Swal.showValidationMessage('Data inicial não pode ser maior que a final');
                        return null;
                    }
                    return { inicio: new Date(inicio), fim: new Date(fim) };
                }
                return null;
            }
        }).then(result => {
            if (result.isConfirmed && result.value) {
                periodoInicio = result.value.inicio;
                periodoFim = result.value.fim;
                renderizarDashboard();
            }
        });
    };

    window.limparPeriodo = function() {
        periodoInicio = null;
        periodoFim = null;
        renderizarDashboard();
    };

    // ==========================================
    // 13. FUNÇÕES AUXILIARES
    // ==========================================
    function formatCurrency(value) {
        if (typeof value !== 'number') value = parseFloat(value) || 0;
        return '€ ' + value.toFixed(2).replace('.', ',');
    }

    function formatDate(date) {
        if (!date) return '';
        if (typeof date === 'string') date = new Date(date);
        return date.toLocaleDateString('pt-PT');
    }

    window.verCliente = function(clientId) {
        const client = dashboardData.clients.find(c => c.id === clientId);
        if (!client) return;

        Swal.fire({
            title: client.name,
            html: `
                <div class="text-start">
                    <p><strong>📞 Telefone:</strong> ${client.phone || 'Não informado'}</p>
                    <p><strong>📧 E-mail:</strong> ${client.email || 'Não informado'}</p>
                    <p><strong>🎂 Nascimento:</strong> ${formatDate(client.birthdate) || 'Não informado'}</p>
                    <p><strong>📅 Cadastrado:</strong> ${client.createdAt ? formatDate(client.createdAt) : 'Não informado'}</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Fechar'
        });
    };

    window.recarregarDashboard = function() {
        carregarDadosDashboard().then(() => {
            renderizarDashboard();
            Swal.fire('✅ Dashboard atualizado!', '', 'success');
        });
    };

    // ==========================================
    // 14. EVENTOS
    // ==========================================
    function configurarEventos() {
        // Ouvir mudanças nos dados
        if (window.db) {
            // Listener para mudanças em tempo real
            const uid = window.currentUser?.uid;
            if (uid) {
                db.collection('services').where('userId', '==', uid)
                    .onSnapshot(() => {
                        carregarDadosDashboard().then(() => {
                            if (document.getElementById('dashboard')?.classList.contains('active')) {
                                renderizarDashboard();
                            }
                        });
                    });
            }
        }
    }

    function adicionarEventosDinamicos() {
        // Eventos para os botões dentro do dashboard
        document.querySelectorAll('.btn-refresh-dashboard').forEach(btn => {
            btn.addEventListener('click', window.recarregarDashboard);
        });
    }

    // ==========================================
    // 15. ESTILOS CSS
    // ==========================================
    function adicionarEstilosDashboard() {
        const styleId = 'dashboardStyles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* DASHBOARD - ESTILOS COMPLETOS */
            .dashboard-header {
                background: linear-gradient(135deg, #26196b, #4a3a9c);
                color: white;
                padding: 20px 24px;
                border-radius: 12px;
                margin-bottom: 20px;
            }
            .dashboard-header h1 {
                font-size: 1.4rem;
                font-weight: 700;
                margin: 0;
            }
            .dashboard-header h1 i { color: #ffd700; }
            .dashboard-header .text-muted { color: rgba(255,255,255,0.7) !important; }

            .stats-mini-card {
                background: rgba(255,255,255,0.12);
                border-radius: 10px;
                padding: 10px 14px;
                text-align: center;
            }
            .stats-mini-card .label {
                font-size: 0.7rem;
                text-transform: uppercase;
                opacity: 0.7;
                letter-spacing: 0.3px;
            }
            .stats-mini-card .value {
                font-size: 1.2rem;
                font-weight: 700;
            }
            .stats-mini-card .value.text-success { color: #28a745; }
            .stats-mini-card .value.text-warning { color: #ffc107; }

            .metric-card {
                background: white;
                border-radius: 12px;
                padding: 16px 18px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                transition: all 0.3s;
                height: 100%;
                border-left: 4px solid #26196b;
            }
            .metric-card:hover { transform: translateY(-3px); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
            .metric-card .metric-label {
                font-size: 0.75rem;
                color: #6c757d;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                font-weight: 500;
            }
            .metric-card .metric-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: #2d2d2d;
                line-height: 1.2;
            }
            .metric-card .metric-value.text-success { color: #28a745; }
            .metric-card .metric-value.text-info { color: #17a2b8; }
            .metric-card .metric-value.text-warning { color: #ffc107; }
            .metric-card .metric-sub {
                font-size: 0.7rem;
                color: #adb5bd;
            }
            .metric-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                flex-shrink: 0;
            }
            .metric-icon.green { background: #28a745; }
            .metric-icon.blue { background: #17a2b8; }
            .metric-icon.gold { background: #ffc107; }
            .metric-icon.purple { background: #26196b; }
            .metric-icon.red { background: #dc3545; }

            .chart-container {
                background: white;
                border-radius: 12px;
                padding: 18px 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                height: 280px;
                position: relative;
            }
            .chart-container h6 {
                color: #26196b;
                font-weight: 600;
                margin-bottom: 10px;
                font-size: 0.9rem;
            }

            .card-custom {
                background: white;
                border-radius: 12px;
                padding: 16px 18px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                height: 100%;
            }

            .funcionario-card {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                transition: all 0.3s;
                height: 100%;
            }
            .funcionario-card:hover { transform: translateY(-3px); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
            .funcionario-card .card-header-custom {
                padding: 12px 14px;
                color: white;
                text-align: center;
            }
            .funcionario-card .card-header-custom .avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                object-fit: cover;
                border: 3px solid rgba(255,255,255,0.3);
                margin-bottom: 4px;
            }
            .funcionario-card .card-header-custom .avatar-placeholder {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: bold;
                margin: 0 auto 4px;
                border: 3px solid rgba(255,255,255,0.2);
            }
            .funcionario-card .card-header-custom h6 {
                margin: 0;
                font-weight: 600;
                font-size: 0.85rem;
            }
            .funcionario-card .card-header-custom small {
                opacity: 0.8;
                font-size: 0.65rem;
            }
            .funcionario-card .card-body-custom {
                padding: 10px 14px;
            }
            .funcionario-card .stat-row {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                font-size: 0.78rem;
                border-bottom: 1px solid #f0f0f0;
            }
            .funcionario-card .stat-row:last-child { border-bottom: none; }
            .funcionario-card .stat-row .label { color: #6c757d; }
            .funcionario-card .stat-row .value { font-weight: 600; }
            .funcionario-card .stat-row .value.positive { color: #28a745; }
            .funcionario-card .stat-row .value.negative { color: #dc3545; }

            .progress-custom {
                height: 4px;
                background: #e9ecef;
                border-radius: 4px;
                margin-top: 8px;
                overflow: hidden;
                display: flex;
            }
            .progress-custom .bar {
                height: 100%;
                border-radius: 4px;
                transition: width 0.6s ease;
            }
            .progress-custom .bar.salao { background: #26196b; }
            .progress-custom .bar.comissao { background: #ffd700; }

            .recent-service-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            .recent-service-item:last-child { border-bottom: none; }

            .birthday-item {
                display: flex;
                align-items: center;
                padding: 8px 10px;
                border-bottom: 1px solid #f0f0f0;
                transition: background 0.2s;
                cursor: pointer;
                border-radius: 8px;
            }
            .birthday-item:hover { background: #f8f9fa; }
            .birthday-item.birthday-today { background: #fff3cd; }
            .birthday-item .avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                object-fit: cover;
                margin-right: 10px;
                flex-shrink: 0;
            }
            .birthday-item .avatar-placeholder {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: #26196b;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                margin-right: 10px;
                flex-shrink: 0;
            }
            .birthday-item .info { flex: 1; min-width: 0; }
            .birthday-item .info .name { font-weight: 600; font-size: 0.85rem; }
            .birthday-item .info .date { font-size: 0.7rem; color: #6c757d; }
            .birthday-item .badge-today {
                background: #dc3545;
                color: white;
                font-size: 0.6rem;
                padding: 2px 10px;
                border-radius: 12px;
                font-weight: 600;
                animation: pulse-badge 1.5s infinite;
            }
            .birthday-item .badge-soon {
                background: #ffc107;
                color: #000;
                font-size: 0.6rem;
                padding: 2px 10px;
                border-radius: 12px;
                font-weight: 600;
            }
            @keyframes pulse-badge {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .note-item {
                padding: 10px 12px;
                border-radius: 8px;
                margin-bottom: 6px;
                background: #f8f9fa;
                border-left: 3px solid #17a2b8;
            }
            .note-item.note-payment {
                background: #fff5f5;
                border-left-color: #dc3545;
            }

            .payment-item {
                padding: 10px 12px;
                border-radius: 8px;
                margin-bottom: 6px;
                background: #f0f8ff;
                border-left: 3px solid #28a745;
            }

            .appointment-item {
                padding: 10px 12px;
                border-radius: 8px;
                margin-bottom: 6px;
                background: #f8f9fa;
                border-left: 3px solid #26196b;
            }

            .fs-small { font-size: 0.8rem; }
            .fs-large { font-size: 1.1rem; }

            @media (max-width: 768px) {
                .dashboard-header { padding: 14px 16px; }
                .dashboard-header h1 { font-size: 1.1rem; }
                .stats-mini-card .value { font-size: 1rem; }
                .metric-card .metric-value { font-size: 1.2rem; }
                .metric-card { padding: 12px 14px; }
                .chart-container { height: 200px; padding: 12px 14px; }
                .card-custom { padding: 12px 14px; }
                .funcionario-card .card-header-custom { padding: 10px; }
                .funcionario-card .card-header-custom .avatar,
                .funcionario-card .card-header-custom .avatar-placeholder {
                    width: 40px;
                    height: 40px;
                    font-size: 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ==========================================
    // 16. INICIALIZAÇÃO
    // ==========================================
    // Adicionar estilos
    adicionarEstilosDashboard();

    // Tentar carregar automaticamente se a seção estiver visível
    document.addEventListener('DOMContentLoaded', function() {
        // Verificar se o dashboard já está visível
        const dashboardSection = document.getElementById('dashboard');
        if (dashboardSection && dashboardSection.classList.contains('active')) {
            window.carregarDashboard();
        }
    });

    // Observar mudanças na classe da seção dashboard
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const dashboard = document.getElementById('dashboard');
                if (dashboard && dashboard.classList.contains('active')) {
                    window.carregarDashboard();
                }
            }
        });
    });

    // Iniciar observador quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', function() {
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            observer.observe(dashboard, { attributes: true });
        }
    });

    console.log('✅ Dashboard.js carregado com sucesso!');
    console.log('📌 Para carregar o dashboard, chame: window.carregarDashboard()');
    console.log('📌 Funcionalidades:');
    console.log('   - Cards de funcionários com estatísticas (dia, semana, mês, total)');
    console.log('   - Calendário para selecionar período entre duas datas');
    console.log('   - Notas com vinculação a cliente e colaborador');
    console.log('   - Pagamentos com registro automático de notas');
    console.log('   - Próximas marcações');
    console.log('   - Aniversários e métricas em tempo real');

})();
