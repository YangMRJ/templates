// ============================================================
// VARIÁVEIS GLOBAIS E COOKIE
// ============================================================
var feriadosDoAno = [];
var perfilUsuario = null;
var listaUsuariosCache = {};

function obterCookie() {
    return localStorage.getItem('cookieSessao') || null;
}

function salvarCookie(cookie) {
    if (cookie) {
        console.log('Salvando cookie:', cookie);
        localStorage.setItem('cookieSessao', cookie);
    } else {
        console.warn('Tentativa de salvar cookie vazio');
    }
}

function limparCookie() {
    localStorage.removeItem('cookieSessao');
    console.log('Cookie removido');
}

// ============================================================
// EXIBIÇÃO (LOGIN/LOGOUT)
// ============================================================
function exibirModulos(show) {
    var sidebar = document.getElementById('sidebarPrincipal');
    var welcomeCard = document.getElementById('welcomeCardSidebar');
    var welcomeContent = document.getElementById('welcomeContent');
    var tabContent = document.querySelector('.main-tab-content');

    if (show) {
        welcomeCard.style.display = 'none';
        welcomeContent.style.display = 'none';
        sidebar.classList.add('logged-in');
        tabContent.classList.add('show');
    } else {
        sidebar.classList.remove('logged-in');
        tabContent.classList.remove('show');
        welcomeCard.style.display = 'block';
        welcomeContent.style.display = 'block';
    }
}

function atualizarBotaoGestao(perfil) {
    var btn = document.getElementById('btnGestao');
    if (perfil === 'admin') {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
    }
}

// ============================================================
// AUTENTICAÇÃO
// ============================================================
function verificarSessao() {
    var cookieAtual = obterCookie();
    console.log('Verificando sessão com cookie:', cookieAtual);
    google.script.run
        .withSuccessHandler(function(data) {
            if (data._cookie) salvarCookie(data._cookie);
            if (data.status === 'sucesso') {
                document.getElementById('userNameDisplaySidebar').textContent = data.nome || data.usuario;
                document.getElementById('userCodeDisplaySidebar').textContent = data.usuario;
                document.getElementById('userInfoSidebar').style.display = 'block';
                document.getElementById('loginFormArea').style.display = 'none';
                exibirModulos(true);
                perfilUsuario = data.perfil;
                atualizarBotaoGestao(perfilUsuario);
            } else {
                limparCookie();
                document.getElementById('userInfoSidebar').style.display = 'none';
                document.getElementById('loginFormArea').style.display = 'block';
                exibirModulos(false);
                perfilUsuario = null;
                atualizarBotaoGestao(null);
            }
        })
        .withFailureHandler(function(err) {
            console.error('Erro ao verificar sessão:', err);
            limparCookie();
            document.getElementById('userInfoSidebar').style.display = 'none';
            document.getElementById('loginFormArea').style.display = 'block';
            exibirModulos(false);
            perfilUsuario = null;
            atualizarBotaoGestao(null);
        })
        .apiVerificarSessao(cookieAtual);
}

function forcarLogoutInicial() {
    var cookieAtual = obterCookie();
    limparCookie();
    document.getElementById('userInfoSidebar').style.display = 'none';
    document.getElementById('loginFormArea').style.display = 'block';
    exibirModulos(false);
    perfilUsuario = null;
    atualizarBotaoGestao(null);

    if (cookieAtual) {
        google.script.run
            .withSuccessHandler(function() {
                console.log('Sessão anterior encerrada no servidor.');
            })
            .withFailureHandler(function(err) {
                console.warn('Falha ao encerrar sessão anterior no servidor:', err);
            })
            .apiLogout(cookieAtual);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    forcarLogoutInicial();

    document.getElementById('formLoginSidebar').addEventListener('submit', function(e) {
        e.preventDefault();
        var usuario = document.getElementById('loginUsuarioSidebar').value.trim();
        var senha = document.getElementById('loginSenhaSidebar').value;
        var msgDiv = document.getElementById('loginMessageSidebar');
        msgDiv.style.display = 'none';

        console.log('Tentando login com usuário:', usuario);
        google.script.run
            .withSuccessHandler(function(data) {
                console.log('Resposta do login:', data);
                if (data._cookie) salvarCookie(data._cookie);
                if (data.status === 'sucesso') {
                    document.getElementById('userNameDisplaySidebar').textContent = data.nome || data.usuario;
                    document.getElementById('userCodeDisplaySidebar').textContent = data.usuario;
                    document.getElementById('userInfoSidebar').style.display = 'block';
                    document.getElementById('loginFormArea').style.display = 'none';
                    exibirModulos(true);
                    perfilUsuario = data.perfil;
                    atualizarBotaoGestao(perfilUsuario);
                    document.getElementById('loginUsuarioSidebar').value = '';
                    document.getElementById('loginSenhaSidebar').value = '';
                } else {
                    msgDiv.textContent = data.mensagem || 'Erro no login.';
                    msgDiv.style.display = 'block';
                    perfilUsuario = null;
                    atualizarBotaoGestao(null);
                }
            })
            .withFailureHandler(function(err) {
                console.error('Falha no login:', err);
                msgDiv.textContent = 'Erro de comunicação: ' + err;
                msgDiv.style.display = 'block';
                perfilUsuario = null;
                atualizarBotaoGestao(null);
            })
            .apiLogin(usuario, senha, obterCookie());
    });

    document.getElementById('formCredenciais').addEventListener('submit', function(e) {
        e.preventDefault();
        var oracleUser = document.getElementById('oracleUserSidebar').value.trim();
        var oraclePassword = document.getElementById('oraclePasswordSidebar').value;
        var msgDiv = document.getElementById('credenciaisMessage');
        msgDiv.style.display = 'none';

        google.script.run
            .withSuccessHandler(function(data) {
                if (data._cookie) salvarCookie(data._cookie);
                if (data.status === 'sucesso') {
                    msgDiv.className = 'text-success small mb-2';
                    msgDiv.textContent = 'Credenciais salvas!';
                    msgDiv.style.display = 'block';
                } else {
                    msgDiv.className = 'text-danger small mb-2';
                    msgDiv.textContent = data.mensagem || 'Erro ao salvar.';
                    msgDiv.style.display = 'block';
                }
            })
            .withFailureHandler(function(err) {
                msgDiv.className = 'text-danger small mb-2';
                msgDiv.textContent = 'Erro de comunicação: ' + err;
                msgDiv.style.display = 'block';
            })
            .apiSetCredenciais(oracleUser, oraclePassword, obterCookie());
    });

    document.getElementById('btnLogoutSidebar').addEventListener('click', function() {
        google.script.run
            .withSuccessHandler(function(data) {
                limparCookie();
                document.getElementById('userInfoSidebar').style.display = 'none';
                document.getElementById('loginFormArea').style.display = 'block';
                exibirModulos(false);
                perfilUsuario = null;
                atualizarBotaoGestao(null);
            })
            .withFailureHandler(function(err) { alert('Erro ao sair: ' + err); })
            .apiLogout(obterCookie());
    });
});

// ============================================================
// PERFIL E GESTÃO
// ============================================================
function abrirModalGestao() {
    if (perfilUsuario !== 'admin') {
        alert('Acesso negado. Você não tem permissão para acessar este módulo.');
        return;
    }
    var modal = new bootstrap.Modal(document.getElementById('modalGestao'));
    modal.show();
    carregarUsuarios();
}

function carregarUsuarios() {
    google.script.run
        .withSuccessHandler(function(res) {
            if (res._cookie) salvarCookie(res._cookie);
            if (res.status === 'sucesso') {
                listaUsuariosCache = res.usuarios;
                renderizarTabelaUsuarios(res.usuarios);
                document.getElementById('msgGestao').innerHTML = '';
            } else {
                document.getElementById('msgGestao').innerHTML = '<div class="alert alert-danger">' + res.mensagem + '</div>';
            }
        })
        .withFailureHandler(function(err) {
            document.getElementById('msgGestao').innerHTML = '<div class="alert alert-danger">Erro: ' + err + '</div>';
        })
        .apiListarUsuarios(obterCookie());
}

function renderizarTabelaUsuarios(usuarios) {
    var tbody = document.getElementById('tbodyUsuarios');
    tbody.innerHTML = '';
    for (var u in usuarios) {
        var user = usuarios[u];
        var tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${u}</strong></td>
            <td>${user.nome}</td>
            <td><span class="badge ${user.perfil === 'admin' ? 'bg-primary' : 'bg-secondary'}">${user.perfil}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarUsuario('${u}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="excluirUsuario('${u}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    }
    var searchVal = document.getElementById('searchUserInput').value.toLowerCase();
    if (searchVal) {
        filtrarTabela(searchVal);
    }
}

function filtrarTabela(termo) {
    var rows = document.querySelectorAll('#tbodyUsuarios tr');
    var termoLower = termo.toLowerCase();
    rows.forEach(function(row) {
        var usuario = row.cells[0].textContent.toLowerCase();
        var nome = row.cells[1].textContent.toLowerCase();
        if (usuario.includes(termoLower) || nome.includes(termoLower)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('searchUserInput').addEventListener('input', function() {
        filtrarTabela(this.value);
    });
});

function editarUsuario(usuario) {
    var novoNome = prompt("Novo nome (deixe em branco para não alterar):", "");
    if (novoNome === null) return;
    var novoPerfil = prompt("Novo perfil (admin/comum, deixe em branco para não alterar):", "");
    var novaSenha = prompt("Nova senha (deixe em branco para não alterar):", "");
    var dados = {};
    if (novoNome) dados.nome = novoNome;
    if (novoPerfil) dados.perfil = novoPerfil;
    if (novaSenha) dados.senha = novaSenha;
    if (Object.keys(dados).length === 0) {
        alert("Nenhuma alteração fornecida.");
        return;
    }
    google.script.run
        .withSuccessHandler(function(res) {
            if (res._cookie) salvarCookie(res._cookie);
            if (res.status === 'sucesso') {
                document.getElementById('msgGestao').innerHTML = '<div class="alert alert-success">' + res.mensagem + '</div>';
                carregarUsuarios();
            } else {
                document.getElementById('msgGestao').innerHTML = '<div class="alert alert-danger">' + res.mensagem + '</div>';
            }
        })
        .withFailureHandler(function(err) {
            document.getElementById('msgGestao').innerHTML = '<div class="alert alert-danger">Erro: ' + err + '</div>';
        })
        .apiAtualizarUsuario(usuario, dados, obterCookie());
}

function excluirUsuario(usuario) {
    if (!confirm("Tem certeza que deseja excluir o usuário '" + usuario + "'?")) return;
    google.script.run
        .withSuccessHandler(function(res) {
            if (res._cookie) salvarCookie(res._cookie);
            if (res.status === 'sucesso') {
                document.getElementById('msgGestao').innerHTML = '<div class="alert alert-success">' + res.mensagem + '</div>';
                carregarUsuarios();
            } else {
                document.getElementById('msgGestao').innerHTML = '<div class="alert alert-danger">' + res.mensagem + '</div>';
            }
        })
        .withFailureHandler(function(err) {
            document.getElementById('msgGestao').innerHTML = '<div class="alert alert-danger">Erro: ' + err + '</div>';
        })
        .apiExcluirUsuario(usuario, obterCookie());
}

document.getElementById('formNovoUsuario').addEventListener('submit', function(e) {
    e.preventDefault();
    var usuario = document.getElementById('novoUsuario').value.trim();
    var nome = document.getElementById('novoNome').value.trim();
    var senha = document.getElementById('novaSenha').value;
    var perfil = document.getElementById('novoPerfil').value;
    if (!usuario || !nome || !senha) {
        alert("Preencha todos os campos.");
        return;
    }
    google.script.run
        .withSuccessHandler(function(res) {
            if (res._cookie) salvarCookie(res._cookie);
            if (res.status === 'sucesso') {
                document.getElementById('msgGestao').innerHTML = '<div class="alert alert-success">' + res.mensagem + '</div>';
                carregarUsuarios();
                document.getElementById('formNovoUsuario').reset();
            } else {
                document.getElementById('msgGestao').innerHTML = '<div class="alert alert-danger">' + res.mensagem + '</div>';
            }
        })
        .withFailureHandler(function(err) {
            document.getElementById('msgGestao').innerHTML = '<div class="alert alert-danger">Erro: ' + err + '</div>';
        })
        .apiCriarUsuario(usuario, senha, nome, perfil, obterCookie());
});

// ============================================================
// TOGGLE MODO ESCURO / CLARO
// ============================================================
function toggleDarkMode() {
    var html = document.documentElement;
    var currentTheme = html.getAttribute('data-bs-theme');
    var icon = document.getElementById('themeIcon');
    var text = document.getElementById('themeText');

    if (currentTheme === 'dark') {
        html.setAttribute('data-bs-theme', 'light');
        icon.className = 'bi bi-moon-stars-fill';
        text.innerText = 'Modo Escuro';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-bs-theme', 'dark');
        icon.className = 'bi bi-sun-fill';
        text.innerText = 'Modo Claro';
        localStorage.setItem('theme', 'dark');
    }
}

(function() {
    var savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        document.getElementById('themeIcon').className = 'bi bi-sun-fill';
        document.getElementById('themeText').innerText = 'Modo Claro';
    }
})();

// ============================================================
// BOTÃO VOLTAR AO TOPO
// ============================================================
var mainContent = document.getElementById('mainContent');
mainContent.addEventListener('scroll', function() {
    var btn = document.getElementById("btnBackToTop");
    if (mainContent.scrollTop > 200) {
        btn.classList.add("show");
    } else {
        btn.classList.remove("show");
    }
});

function scrollToTop() {
    document.getElementById('mainContent').scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// FILTRO E ORDENAÇÃO DE TABELAS
// ============================================================
var tfState = {};
var TF_TABLE_IDS = ['tbComparativo', 'tbPrimeiraParcela', 'tbDivergencia', 'tbNaoEncerradas',
    'tbProgressao', 'tbCritica', 'tbAumentos', 'tbBase'
];

function tfCreateFilterBar(tableId) {
    var placeholder = document.getElementById('tf-bar-' + tableId);
    if (!placeholder || placeholder.dataset.tfInit === '1') return;
    placeholder.dataset.tfInit = '1';
    placeholder.innerHTML =
        '<div class="tf-search-box" style="margin-top: 10px; margin-bottom: 10px;">' +
        '<i class="bi bi-search"></i>' +
        '<input type="text" class="tf-search-input" id="tf-search-' + tableId +
        '" placeholder="Filtrar resultados...">' +
        '<i class="bi bi-x-circle tf-clear-btn" id="tf-clear-' + tableId +
        '" title="Limpar filtro" style="display:none;"></i>' +
        '</div>';
    var input = document.getElementById('tf-search-' + tableId);
    var clearBtn = document.getElementById('tf-clear-' + tableId);
    input.addEventListener('input', function() {
        clearBtn.style.display = this.value ? 'inline-block' : 'none';
        tfApplyFilter(tableId, this.value);
    });
    clearBtn.addEventListener('click', function() {
        input.value = '';
        clearBtn.style.display = 'none';
        tfApplyFilter(tableId, '');
        input.focus();
    });
}

function tfIsPlaceholderRow(tr) {
    var tds = tr.querySelectorAll('td');
    return tds.length === 1 && tds[0].hasAttribute('colspan');
}

function tfApplyFilter(tableId, query) {
    var table = document.getElementById(tableId);
    if (!table) return;
    var tbody = table.querySelector('tbody');
    if (!tbody) return;
    query = (query || '').trim().toLowerCase();
    var rows = tbody.querySelectorAll('tr');
    var visibleCount = 0;
    rows.forEach(function(tr) {
        if (tr.classList.contains('tf-no-match-row')) return;
        if (tfIsPlaceholderRow(tr)) {
            tr.style.display = query ? 'none' : '';
            return;
        }
        var text = tr.textContent.toLowerCase();
        var match = !query || text.includes(query);
        tr.style.display = match ? '' : 'none';
        if (match) visibleCount++;
    });
    tfUpdateEmptyState(table, tbody, visibleCount, query);
}

function tfUpdateEmptyState(table, tbody, visibleCount, query) {
    var existing = tbody.querySelector('.tf-no-match-row');
    if (visibleCount === 0 && query) {
        if (!existing) {
            var colCount = table.querySelectorAll('thead th').length || 1;
            var tr = document.createElement('tr');
            tr.className = 'tf-no-match-row';
            tr.innerHTML = '<td colspan="' + colCount +
                '" class="text-center text-muted py-3"><i class="bi bi-search me-1"></i>Nenhum resultado para o filtro aplicado.</td>';
            tbody.appendChild(tr);
        }
    } else if (existing) {
        existing.remove();
    }
}

function tfParseValue(text) {
    text = (text || '').trim();
    if (!text) return { type: 'text', value: '' };
    var mData = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (mData) {
        return { type: 'date', value: new Date(mData[3], mData[2] - 1, mData[1]).getTime() };
    }
    var limpo = text.replace(/^R\$\s?/, '').replace('%', '').trim();
    if (/\d/.test(limpo) && /^-?[\d.,]+$/.test(limpo)) {
        var normalizado = limpo.indexOf(',') > -1 ?
            limpo.replace(/\./g, '').replace(',', '.') :
            limpo;
        var num = parseFloat(normalizado);
        if (!isNaN(num)) return { type: 'number', value: num };
    }
    return { type: 'text', value: text.toLowerCase() };
}

function tfEnableSort(tableId) {
    var table = document.getElementById(tableId);
    if (!table) return;
    var ths = table.querySelectorAll('thead th');
    ths.forEach(function(th, colIndex) {
        if (th.dataset.tfBound === '1') return;
        th.dataset.tfBound = '1';
        th.classList.add('tf-sortable');
        var iconSpan = document.createElement('i');
        iconSpan.className = 'bi bi-arrow-down-up tf-sort-icon';
        th.appendChild(iconSpan);
        th.addEventListener('click', function() {
            tfSortByColumn(tableId, colIndex, th);
        });
    });
}

function tfSortByColumn(tableId, colIndex, th) {
    var table = document.getElementById(tableId);
    var tbody = table.querySelector('tbody');
    if (!tbody) return;
    var state = tfState[tableId] || (tfState[tableId] = {});
    var dir = (state.sortCol === colIndex && state.sortDir === 'asc') ? 'desc' : 'asc';
    state.sortCol = colIndex;
    state.sortDir = dir;

    var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr')).filter(function(tr) {
        return !tfIsPlaceholderRow(tr) && !tr.classList.contains('tf-no-match-row');
    });

    rows.sort(function(a, b) {
        var cellA = a.children[colIndex] ? a.children[colIndex].textContent : '';
        var cellB = b.children[colIndex] ? b.children[colIndex].textContent : '';
        var pa = tfParseValue(cellA);
        var pb = tfParseValue(cellB);
        if (pa.value < pb.value) return dir === 'asc' ? -1 : 1;
        if (pa.value > pb.value) return dir === 'asc' ? 1 : -1;
        return 0;
    });

    var noMatchRow = tbody.querySelector('.tf-no-match-row');
    rows.forEach(function(tr) { tbody.appendChild(tr); });
    if (noMatchRow) tbody.appendChild(noMatchRow);

    table.querySelectorAll('thead th .tf-sort-icon').forEach(function(icon) {
        icon.className = 'bi bi-arrow-down-up tf-sort-icon';
    });
    var activeIcon = th.querySelector('.tf-sort-icon');
    if (activeIcon) {
        activeIcon.className = dir === 'asc' ?
            'bi bi-sort-up-alt tf-sort-icon tf-sort-active' :
            'bi bi-sort-down tf-sort-icon tf-sort-active';
    }
}

function refreshTableFilter(tableId) {
    tfState[tableId] = {};
    tfEnableSort(tableId);
    var input = document.getElementById('tf-search-' + tableId);
    if (input && input.value) {
        input.value = '';
        var clearBtn = document.getElementById('tf-clear-' + tableId);
        if (clearBtn) clearBtn.style.display = 'none';
    }
    var table = document.getElementById(tableId);
    if (table) {
        var noMatchRow = table.querySelector('.tf-no-match-row');
        if (noMatchRow) noMatchRow.remove();
        table.querySelectorAll('thead th .tf-sort-icon').forEach(function(icon) {
            icon.className = 'bi bi-arrow-down-up tf-sort-icon';
        });
    }
}

function initTableFilters() {
    TF_TABLE_IDS.forEach(function(id) {
        tfCreateFilterBar(id);
        tfEnableSort(id);
    });
}

document.addEventListener('DOMContentLoaded', initTableFilters);

// ============================================================
// 1. COMPARATIVO
// ============================================================
document.getElementById('formComparativo').addEventListener('submit', function(e) {
    e.preventDefault();
    var mesAnt = document.getElementById('compMesAnt').value;
    var mesAtu = document.getElementById('compMesAtu').value;
    var numFolha = document.getElementById('compNumFolha').value.trim();
    var emp = parseInt(document.getElementById('compEmp').value, 10);

    if (!numFolha) {
        alert('Informe pelo menos um número de folha.');
        return;
    }
    if (!/^[\d, ]+$/.test(numFolha)) {
        alert('Use apenas números e vírgulas. Ex: 50,51,52');
        return;
    }

    document.getElementById('loaderComparativo').style.display = 'block';
    document.getElementById('resComparativoContainer').style.display = 'none';

    google.script.run
        .withSuccessHandler(function(res) {
            if (res && res._cookie) salvarCookie(res._cookie);
            document.getElementById('loaderComparativo').style.display = 'none';
            renderizarComparativo(res);
        })
        .withFailureHandler(function(err) {
            document.getElementById('loaderComparativo').style.display = 'none';
            tratarErro(err);
        })
        .apiComparativo(mesAnt, mesAtu, numFolha, emp, obterCookie());
});

function renderizarComparativo(res) {
    if (!res.sucesso) { alert("Erro: " + res.erro); return; }
    document.getElementById('tituloRelatorioComp').innerText = res.titulo;
    var tbody = document.getElementById('bodyComparativo');
    tbody.innerHTML = '';
    if (!res.linhas || res.linhas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Nenhum registro.</td></tr>';
    } else {
        res.linhas.forEach(function(row) {
            var tr = document.createElement('tr');
            var badgeClass = row.difValor >= 0 ? 'bg-success-subtle text-success border border-success-subtle' :
                'bg-danger-subtle text-danger border border-danger-subtle';
            tr.innerHTML = `
                <td class="fw-bold">${row.rubrica}</td>
                <td>${row.compl || '-'}</td>
                <td class="text-center">${row.quantAnterior}</td>
                <td class="text-center">${formatarMoeda(row.valorAnterior)}</td>
                <td class="text-center">${row.quantAtual}</td>
                <td class="text-center">${formatarMoeda(row.valorAtual)}</td>
                <td class="text-center fw-bold">${formatarMoeda(row.difValor)}</td>
                <td class="text-center"><span class="badge badge-status ${badgeClass}">${row.difPercent.toFixed(2)}%</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
    document.getElementById('resComparativoContainer').style.display = 'block';
    refreshTableFilter('tbComparativo');
}

// ============================================================
// 2. CARGA DE ELEITOS
// ============================================================
document.getElementById('formCargaEleitos').addEventListener('submit', function(e) {
    e.preventDefault();
    var dados = {
        dtVac1: document.getElementById('dtVac1').value,
        dtVac2: document.getElementById('dtVac2').value,
        dtIniFolha: document.getElementById('dtIniFolha').value,
        grupoSME: document.getElementById('grupoSME').value,
        grupoSMS: document.getElementById('grupoSMS').value,
        grupoPGM: document.getElementById('grupoPGM').value,
        grupoOutros: document.getElementById('grupoOutros').value
    };
    document.getElementById('loaderCarga').style.display = 'block';
    document.getElementById('resCargaContainer').style.display = 'none';

    google.script.run
        .withSuccessHandler(function(res) {
            if (res && res._cookie) salvarCookie(res._cookie);
            document.getElementById('loaderCarga').style.display = 'none';
            if (!res.sucesso) { alert("Erro: " + res.erro); return; }
            document.getElementById('txtCargaOutput').innerText = res.conteudoTxt;
            document.getElementById('resCargaContainer').style.display = 'block';
        })
        .withFailureHandler(function(err) {
            document.getElementById('loaderCarga').style.display = 'none';
            tratarErro(err);
        })
        .apiCargaEleitos(dados, obterCookie());
});

// ============================================================
// 3. CONSIGNADO – CONFERÊNCIA
// ============================================================
function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    var partes = dataISO.split('-');
    if (partes.length !== 3) return '';
    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function executarConsignadoReal() {
    var d1 = document.getElementById('consData1').value;
    var d2 = document.getElementById('consData2').value;
    var d3 = document.getElementById('consData3').value;

    if (!d1 || !d2 || !d3) {
        alert('Preencha todas as datas.');
        return;
    }

    var datas = [formatarDataBR(d1), formatarDataBR(d2), formatarDataBR(d3)];

    document.getElementById('loaderConsignado').style.display = 'block';
    document.getElementById('resConsignadoContainer').style.display = 'none';

    var cookie = obterCookie();

    google.script.run
        .withSuccessHandler(function(res) {
            try {
                document.getElementById('loaderConsignado').style.display = 'none';
                if (!res) {
                    alert('Resposta vazia da API.');
                    return;
                }
                if (res.status === 'sucesso') {
                    renderizarResultadosConsignado(res);
                } else {
                    alert('Erro: ' + (res.mensagem || 'Resposta inválida'));
                }
            } catch (e) {
                alert('Erro ao processar resposta: ' + e.message);
                console.error(e);
            }
        })
        .withFailureHandler(function(err) {
            document.getElementById('loaderConsignado').style.display = 'none';
            alert('Erro de comunicação: ' + err);
        })
        .apiConfereCons(datas, null, cookie);
}

function renderizarResultadosConsignado(res) {
    var resultados = res.resultados || {};
    var aumentos = res.aumentos || [];
    var base = res.base || [];

    document.getElementById('contPrimeiraParcela').textContent = (resultados.primeira_parcela || []).length;
    document.getElementById('contDivergencia').textContent = (resultados.divergencia || []).length;
    document.getElementById('contNaoEncerradas').textContent = (resultados.nao_encerradas || []).length;
    document.getElementById('contProgressao').textContent = (resultados.progressao || []).length;
    document.getElementById('contCritica').textContent = (resultados.critica || []).length;
    document.getElementById('contAumentos').textContent = aumentos.length;

    preencherTabelaCons('#tbPrimeiraParcela tbody', resultados.primeira_parcela || [], ['matricula','rubrica','ultimoMes','parcela']);
    preencherTabelaCons('#tbDivergencia tbody', resultados.divergencia || [], ['matricula','rubrica','valorAnt','valorAtual','diferenca']);
    preencherTabelaCons('#tbNaoEncerradas tbody', resultados.nao_encerradas || [], ['matricula','rubrica','ultimaParcela']);
    preencherTabelaCons('#tbProgressao tbody', resultados.progressao || [], ['matricula','rubrica','parcelaAnt','parcelaAtual','esperado']);
    preencherTabelaCons('#tbCritica tbody', resultados.critica || [], ['matricula','rubrica','mensagem']);
    preencherTabelaCons('#tbAumentos tbody', aumentos, ['empresa','rubrica','nome','variacao']);
    preencherTabelaCons('#tbBase tbody', base, ['matricula','rubrica','mes1','mes2','mes3','parcelas']);

    document.getElementById('resConsignadoContainer').style.display = 'block';
}

function preencherTabelaCons(selector, dados, colunas) {
    var tbody = document.querySelector(selector);
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!dados || dados.length === 0) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="' + colunas.length + '" class="text-center text-muted">Nenhum registro</td>';
        tbody.appendChild(tr);
    } else {
        dados.forEach(function(row) {
            var tr = document.createElement('tr');
            var celulas = colunas.map(function(col) {
                return row[col] !== undefined ? row[col] : '';
            });
            tr.innerHTML = celulas.map(function(c) { return '<td>' + c + '</td>'; }).join('');
            tbody.appendChild(tr);
        });
    }
    var tableId = selector.split(' ')[0].replace('#', '');
    refreshTableFilter(tableId);
}

document.addEventListener('DOMContentLoaded', function() {
    var formCons = document.getElementById('formConsignado');
    if (formCons) {
        formCons.removeEventListener('submit', executarConsignadoReal);
        formCons.addEventListener('submit', function(e) {
            e.preventDefault();
            executarConsignadoReal();
        });
    }
});

// ============================================================
// 4. RETENÇÕES (NOVA ABA)
// ============================================================
var retencoesData = {
    monthSummary: {},
    sourceSummary: {},
    rubricasSummary: {},
    months: [],
    sources: [],
    tipos: [],
    empCodigos: []
};
var selectedEmpresasRetencoes = [];
var retencoesRawData = [];

var empresaNomes = {
    '1': 'PCRJ', '2': 'FUNPREVI', '3': 'PREVI_RIO', '4': 'PENSAO',
    '5': 'GEO_RIO', '6': 'IPP', '7': 'PLANETARIO', '8': 'FPJ',
    '10': 'CIDADE_ARTES', '11': 'RIO_AGUAS', '12': 'GM_RIO',
    '13': 'CET_RIO', '16': 'MULTIRIO', '17': 'RIOURBE',
    '18': 'IPLANRIO', '20': 'RIOFILME', '21': 'RIOLUZ', '23': 'RIOSAUDE'
};

function updateRetencoesFilterInfo() {
    var checkTodos = document.getElementById('checkTodosRetencoes');
    var filterValue;
    if (!checkTodos || checkTodos.checked || selectedEmpresasRetencoes.length === 0) {
        filterValue = 'Todas as empresas';
    } else if (selectedEmpresasRetencoes.length <= 5) {
        filterValue = selectedEmpresasRetencoes.map(codigo => {
            return `${codigo} - ${empresaNomes[codigo] || codigo}`;
        }).join(', ');
    } else {
        filterValue = `${selectedEmpresasRetencoes.length} empresas selecionadas`;
    }
    document.getElementById('retencoesFilterInfo').textContent = 'Empresas: ' + filterValue;
    document.getElementById('retencoesSourceFilterInfo').textContent = 'Empresas: ' + filterValue;
    document.getElementById('retencoesRubricasFilterInfo').textContent = 'Empresas: ' + filterValue;
}

function populateRetencoesEmpFilter(empCodigos) {
    var container = document.getElementById('empFilterItemsRetencoes');
    if (!container) return;
    container.innerHTML = '';

    empCodigos.sort((a, b) => parseInt(a) - parseInt(b));

    empCodigos.forEach(codigo => {
        var nomeEmpresa = empresaNomes[codigo] || codigo;
        var li = document.createElement('li');
        li.innerHTML = `
            <div class="form-check">
                <input class="form-check-input emp-checkbox-retencoes" type="checkbox" value="${codigo}" id="emp_ret_${codigo}">
                <label class="form-check-label" for="emp_ret_${codigo}">
                    ${codigo} - ${nomeEmpresa}
                </label>
            </div>
        `;
        container.appendChild(li);
    });

    document.querySelectorAll('.emp-checkbox-retencoes').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('checkTodosRetencoes').checked = false;
                selectedEmpresasRetencoes.push(this.value);
            } else {
                selectedEmpresasRetencoes = selectedEmpresasRetencoes.filter(emp => emp !== this.value);
            }
            updateRetencoesFilterInfo();
            renderizarRetencoesResumos();
        });
    });

    document.getElementById('checkTodosRetencoes').addEventListener('change', function() {
        if (this.checked) {
            document.querySelectorAll('.emp-checkbox-retencoes').forEach(cb => {
                cb.checked = false;
            });
            selectedEmpresasRetencoes = [];
        }
        updateRetencoesFilterInfo();
        renderizarRetencoesResumos();
    });
    updateRetencoesFilterInfo();
}

function processRetencoesData(data) {
    console.log('Total de linhas recebidas:', data.length);
    if (!data || data.length === 0) {
        retencoesData = { monthSummary: {}, sourceSummary: {}, rubricasSummary: {}, months: [], sources: [], tipos: [], empCodigos: [] };
        return;
    }
    console.log('Chaves disponíveis:', Object.keys(data[0]));
    console.log('Linha completa:', JSON.stringify(data[0], null, 2));
    retencoesRawData = data;

    var tempData = {
        monthSummary: {},
        sourceSummary: {},
        rubricasSummary: {},
        months: [],
        sources: new Set(),
        tipos: new Set(),
        empCodigos: new Set()
    };

    data.forEach(row => {
        var mesAno = row.mes ? String(row.mes) : '';
        var tipo = row.tipo_cons || 'Outros';
        var empresa = String(row.emp_codigo || '');
        var fonte = row.fonte || 'Sem fonte';
        var rubrica = String(row.rubrica || '');
        var valor = parseFloat(row.VALOR_NUM) || 0;

        if (valor === 0) return;

        if (selectedEmpresasRetencoes.length > 0 && !selectedEmpresasRetencoes.includes(empresa)) return;

        var mesStr = '';
        if (mesAno.length >= 6) {
            var ano = mesAno.substring(0, 4);
            var mes = mesAno.substring(4, 6);
            mesStr = mes + '/' + ano;
        } else {
            mesStr = mesAno;
        }
        if (!mesStr) return;
        var mesLabel = mesStr.substring(0, 2);

        tempData.months.push(mesStr);
        tempData.sources.add(fonte);
        tempData.tipos.add(tipo);
        tempData.empCodigos.add(empresa);

        if (!tempData.monthSummary[tipo]) tempData.monthSummary[tipo] = {};
        tempData.monthSummary[tipo][mesLabel] = (tempData.monthSummary[tipo][mesLabel] || 0) + valor;

        if (!tempData.sourceSummary[mesStr]) tempData.sourceSummary[mesStr] = {};
        if (!tempData.sourceSummary[mesStr][fonte]) tempData.sourceSummary[mesStr][fonte] = {};
        tempData.sourceSummary[mesStr][fonte][tipo] = (tempData.sourceSummary[mesStr][fonte][tipo] || 0) + valor;

        if (!tempData.rubricasSummary[mesStr]) tempData.rubricasSummary[mesStr] = {};
        if (!tempData.rubricasSummary[mesStr][tipo]) tempData.rubricasSummary[mesStr][tipo] = {};
        if (!tempData.rubricasSummary[mesStr][tipo][rubrica]) tempData.rubricasSummary[mesStr][tipo][rubrica] = {};
        tempData.rubricasSummary[mesStr][tipo][rubrica][fonte] = (tempData.rubricasSummary[mesStr][tipo][rubrica][fonte] || 0) + valor;
    });

    tempData.months = [...new Set(tempData.months)].sort();
    tempData.sources = [...tempData.sources].sort();
    tempData.tipos = [...tempData.tipos].sort();
    tempData.empCodigos = [...tempData.empCodigos].sort((a,b) => parseInt(a) - parseInt(b));

    retencoesData = {
        monthSummary: tempData.monthSummary,
        sourceSummary: tempData.sourceSummary,
        rubricasSummary: tempData.rubricasSummary,
        months: tempData.months,
        sources: tempData.sources,
        tipos: tempData.tipos,
        empCodigos: tempData.empCodigos
    };

    var allMonthsOption = '<option value="Todos">Todos os meses</option>';
    var monthOptions = retencoesData.months.map(m => `<option value="${m}">${m}</option>`).join('');
    document.getElementById('retencoesMonthSelect').innerHTML = allMonthsOption + monthOptions;
    document.getElementById('retencoesRubricasMonthSelect').innerHTML = allMonthsOption + monthOptions;

    populateRetencoesEmpFilter(retencoesData.empCodigos);
    populateRetencoesMonthTable();
    populateRetencoesSourceTable();
    populateRetencoesRubricasTables();

    // ===== LOGS CORRIGIDOS =====
    var totalGeral = 0;
    console.log('=== Totais por tipo (Nova) ===');
    for (var tipo in retencoesData.monthSummary) {
        var totalTipo = 0;
        for (var mes in retencoesData.monthSummary[tipo]) {
            totalTipo += retencoesData.monthSummary[tipo][mes];
            totalGeral += retencoesData.monthSummary[tipo][mes];
        }
        var formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalTipo);
        console.log(tipo + ': ' + formatted);
    }
    console.log('Total Geral da Nova:', totalGeral);
    var tiposProblema = ['05 - IRPF', '14 - Contribuição Previdenciária - Ativos/RGPS', '06 - Contribuição Previdenciária - Ativos/RPPS', '09 - Pensão Alimentícia', '10 - Plano de Saúde/Odontológico', '13 - Outros Consignatários'];
    console.log('=== Totais por rubrica (Nova) para tipos com divergência ===');
    for (var tipo of tiposProblema) {
        if (retencoesData.rubricasSummary) {
            var rubricasTotais = {};
            for (var mes in retencoesData.rubricasSummary) {
                if (retencoesData.rubricasSummary[mes][tipo]) {
                    for (var rubrica in retencoesData.rubricasSummary[mes][tipo]) {
                        if (!rubricasTotais[rubrica]) rubricasTotais[rubrica] = 0;
                        for (var fonte in retencoesData.rubricasSummary[mes][tipo][rubrica]) {
                            rubricasTotais[rubrica] += retencoesData.rubricasSummary[mes][tipo][rubrica][fonte];
                        }
                    }
                }
            }
            console.log('Tipo:', tipo);
            for (var rub in rubricasTotais) {
                var formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rubricasTotais[rub]);
                console.log('  Rubrica ' + rub + ': ' + formatted);
            }
        }
    }
}

function renderizarRetencoesResumos() {
    if (!retencoesRawData || retencoesRawData.length === 0) return;
    processRetencoesData(retencoesRawData);
    populateRetencoesMonthTable();
    populateRetencoesSourceTable();
    populateRetencoesRubricasTables();
}

function populateRetencoesMonthTable() {
    var tableBody = document.querySelector('#retencoesMonthTable tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    updateRetencoesFilterInfo();

    if (!retencoesData.monthSummary || Object.keys(retencoesData.monthSummary).length === 0) {
        tableBody.innerHTML = '<tr><td colspan="14" class="text-center text-muted">Nenhum dado.</td></tr>';
        return;
    }

    var months = Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
    for (var tipo in retencoesData.monthSummary) {
        var row = document.createElement('tr');
        var totalRow = 0;
        var tipoCell = document.createElement('td');
        tipoCell.textContent = tipo;
        row.appendChild(tipoCell);

        months.forEach(function(month) {
            var value = retencoesData.monthSummary[tipo][month] || 0;
            totalRow += parseFloat(value);
            var cell = document.createElement('td');
            cell.textContent = formatarMoeda(value);
            row.appendChild(cell);
        });

        var totalCell = document.createElement('td');
        totalCell.textContent = formatarMoeda(totalRow);
        totalCell.style.fontWeight = 'bold';
        row.appendChild(totalCell);
        tableBody.appendChild(row);
    }

    var totalRow = document.createElement('tr');
    totalRow.classList.add('table-active');
    var totalLabelCell = document.createElement('td');
    totalLabelCell.textContent = 'TOTAL';
    totalLabelCell.style.fontWeight = 'bold';
    totalRow.appendChild(totalLabelCell);

    var grandTotal = 0;
    months.forEach(function(month) {
        var monthTotal = 0;
        for (var tipo in retencoesData.monthSummary) {
            monthTotal += parseFloat(retencoesData.monthSummary[tipo][month] || 0);
        }
        grandTotal += monthTotal;
        var cell = document.createElement('td');
        cell.textContent = formatarMoeda(monthTotal);
        cell.style.fontWeight = 'bold';
        totalRow.appendChild(cell);
    });
    var grandTotalCell = document.createElement('td');
    grandTotalCell.textContent = formatarMoeda(grandTotal);
    grandTotalCell.style.fontWeight = 'bold';
    totalRow.appendChild(grandTotalCell);
    tableBody.appendChild(totalRow);
}

function populateRetencoesSourceTable() {
    var tableBody = document.querySelector('#retencoesSourceTable tbody');
    var tableHead = document.querySelector('#retencoesSourceTable thead tr');
    if (!tableBody || !tableHead) return;
    tableBody.innerHTML = '';
    tableHead.innerHTML = '<th>Fonte</th>';
    updateRetencoesFilterInfo();

    if (!retencoesData.sourceSummary || Object.keys(retencoesData.sourceSummary).length === 0) {
        tableBody.innerHTML = '<tr><td class="text-center text-muted">Nenhum dado.</td></tr>';
        return;
    }

    var selectedMonth = document.getElementById('retencoesMonthSelect').value;
    var months = selectedMonth === 'Todos' ? retencoesData.months : [selectedMonth];
    var tipos = retencoesData.tipos;

    tipos.forEach(function(tipo) {
        var th = document.createElement('th');
        th.textContent = tipo;
        tableHead.appendChild(th);
    });
    var totalTh = document.createElement('th');
    totalTh.textContent = 'Total';
    tableHead.appendChild(totalTh);

    var sourceData = {};
    retencoesData.sources.forEach(function(source) {
        sourceData[source] = { tipos: {}, total: 0 };
        tipos.forEach(function(tipo) {
            sourceData[source].tipos[tipo] = 0;
        });
    });

    months.forEach(function(month) {
        if (retencoesData.sourceSummary[month]) {
            for (var source in retencoesData.sourceSummary[month]) {
                for (var tipo in retencoesData.sourceSummary[month][source]) {
                    var value = parseFloat(retencoesData.sourceSummary[month][source][tipo] || 0);
                    if (sourceData[source]) {
                        sourceData[source].tipos[tipo] += value;
                        sourceData[source].total += value;
                    }
                }
            }
        }
    });

    for (var source in sourceData) {
        var row = document.createElement('tr');
        var sourceCell = document.createElement('td');
        sourceCell.textContent = source;
        row.appendChild(sourceCell);

        tipos.forEach(function(tipo) {
            var value = sourceData[source].tipos[tipo] || 0;
            var cell = document.createElement('td');
            cell.textContent = formatarMoeda(value);
            row.appendChild(cell);
        });

        var totalCell = document.createElement('td');
        totalCell.textContent = formatarMoeda(sourceData[source].total);
        totalCell.style.fontWeight = 'bold';
        row.appendChild(totalCell);
        tableBody.appendChild(row);
    }
}

function populateRetencoesRubricasTables() {
    var rubricasContainer = document.getElementById('retencoesRubricasContainer');
    if (!rubricasContainer) return;
    rubricasContainer.innerHTML = '';
    updateRetencoesFilterInfo();

    if (!retencoesData.rubricasSummary || Object.keys(retencoesData.rubricasSummary).length === 0) {
        rubricasContainer.innerHTML = '<div class="text-center text-muted">Nenhum dado.</div>';
        return;
    }

    var selectedMonth = document.getElementById('retencoesRubricasMonthSelect').value;
    var months = selectedMonth === 'Todos' ? retencoesData.months : [selectedMonth];
    var tipos = retencoesData.tipos;

    tipos.forEach(function(tipo) {
        var fontesSet = new Set();
        var rubricasMap = {};

        months.forEach(function(month) {
            if (retencoesData.rubricasSummary[month] && retencoesData.rubricasSummary[month][tipo]) {
                var rubricasDoMes = retencoesData.rubricasSummary[month][tipo];
                for (var rub in rubricasDoMes) {
                    if (!rubricasMap[rub]) rubricasMap[rub] = {};
                    for (var fonte in rubricasDoMes[rub]) {
                        var val = parseFloat(rubricasDoMes[rub][fonte] || 0);
                        rubricasMap[rub][fonte] = (rubricasMap[rub][fonte] || 0) + val;
                        fontesSet.add(fonte);
                    }
                }
            }
        });

        var fontes = Array.from(fontesSet).sort();
        if (fontes.length === 0) {
            return;
        }

        var card = document.createElement('div');
        card.classList.add('card', 'mb-3');
        var header = document.createElement('div');
        header.classList.add('card-header');
        header.innerHTML = `<h6 class="mb-0">${tipo}</h6>`;
        card.appendChild(header);

        var body = document.createElement('div');
        body.classList.add('card-body');

        var tableWrapper = document.createElement('div');
        tableWrapper.classList.add('table-container');

        var table = document.createElement('table');
        table.classList.add('table', 'table-striped', 'table-sm', 'rubricas-table');

        var thead = document.createElement('thead');
        var headRow = document.createElement('tr');
        headRow.innerHTML = `<th>Rubrica</th>`;
        fontes.forEach(function(f) {
            headRow.innerHTML += `<th>${f}</th>`;
        });
        headRow.innerHTML += `<th>Total</th>`;
        thead.appendChild(headRow);
        table.appendChild(thead);

        var tbody = document.createElement('tbody');
        var totalPorFonte = {};
        fontes.forEach(function(f) { totalPorFonte[f] = 0; });
        var grandTotal = 0;

        var rubricasOrdenadas = Object.keys(rubricasMap).sort(function(a, b) {
            var sumA = Object.values(rubricasMap[a]).reduce((s, v) => s + v, 0);
            var sumB = Object.values(rubricasMap[b]).reduce((s, v) => s + v, 0);
            return sumB - sumA;
        });

        rubricasOrdenadas.forEach(function(rub) {
            var row = document.createElement('tr');
            row.innerHTML = `<td><strong>${rub}</strong></td>`;
            var totalRubrica = 0;
            fontes.forEach(function(f) {
                var valor = rubricasMap[rub][f] || 0;
                totalRubrica += valor;
                totalPorFonte[f] += valor;
                row.innerHTML += `<td>${formatarMoeda(valor)}</td>`;
            });
            grandTotal += totalRubrica;
            row.innerHTML += `<td><strong>${formatarMoeda(totalRubrica)}</strong></td>`;
            tbody.appendChild(row);
        });

        var totalRow = document.createElement('tr');
        totalRow.classList.add('table-active');
        totalRow.innerHTML = `<td><strong>TOTAL</strong></td>`;
        fontes.forEach(function(f) {
            totalRow.innerHTML += `<td><strong>${formatarMoeda(totalPorFonte[f])}</strong></td>`;
        });
        totalRow.innerHTML += `<td><strong>${formatarMoeda(grandTotal)}</strong></td>`;
        tbody.appendChild(totalRow);

        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        body.appendChild(tableWrapper);
        card.appendChild(body);
        rubricasContainer.appendChild(card);
    });

    if (rubricasContainer.children.length === 0) {
        rubricasContainer.innerHTML = '<div class="text-center text-muted">Nenhuma rubrica com valores para os filtros selecionados.</div>';
    }
}

document.getElementById('retencoesMonthSelect').addEventListener('change', populateRetencoesSourceTable);
document.getElementById('retencoesRubricasMonthSelect').addEventListener('change', populateRetencoesRubricasTables);

document.getElementById('btnGerarRetencoes').addEventListener('click', function(e) {
    e.preventDefault();
    var ano = document.getElementById('retencaoAno').value;
    if (!ano || isNaN(ano) || ano < 2000 || ano > 2100) {
        alert('Informe um ano válido (ex: 2026).');
        return;
    }

    var loader = document.getElementById('loaderRetencoes');
    var container = document.getElementById('resRetencoesContainer');
    loader.style.display = 'block';
    container.style.display = 'none';

    var cookie = obterCookie();

    google.script.run
        .withSuccessHandler(function(res) {
            loader.style.display = 'none';
            if (res.status === 'sucesso') {
                console.log('Dados recebidos da API:', res.dados);
                console.log('Primeiro registro:', res.dados[0]);
                console.log('Campos do primeiro:', Object.keys(res.dados[0]));
                processRetencoesData(res.dados || []);
                container.style.display = 'block';
            } else {
                alert('Erro: ' + (res.mensagem || 'Falha ao carregar dados.'));
            }
        })
        .withFailureHandler(function(err) {
            loader.style.display = 'none';
            alert('Erro de comunicação: ' + err);
        })
        .apiObterRetencoes(ano, cookie);
});

document.getElementById('btnLimparRetencoes').addEventListener('click', function() {
    document.getElementById('resRetencoesContainer').style.display = 'none';
    document.getElementById('loaderRetencoes').style.display = 'none';
    retencoesRawData = [];
    retencoesData = {
        monthSummary: {},
        sourceSummary: {},
        rubricasSummary: {},
        months: [],
        sources: [],
        tipos: [],
        empCodigos: []
    };
    document.querySelector('#retencoesMonthTable tbody').innerHTML = '';
    document.querySelector('#retencoesSourceTable tbody').innerHTML = '';
    document.getElementById('retencoesRubricasContainer').innerHTML = '';
    selectedEmpresasRetencoes = [];
    document.getElementById('checkTodosRetencoes').checked = true;
    document.querySelectorAll('.emp-checkbox-retencoes').forEach(cb => cb.checked = false);
    updateRetencoesFilterInfo();
});

// ============================================================
// 5. CRONOGRAMA
// ============================================================
function carregarFeriados(ano) {
    google.script.run
        .withSuccessHandler(function(lista) {
            feriadosDoAno = lista || [];
            document.querySelectorAll('#sec-cronograma .campo-calculo').forEach(function(el) {
                if (el.id !== 'dtR1658') checarFeriado(el);
            });
        })
        .withFailureHandler(function() { feriadosDoAno = []; })
        .feriados(ano);
}

function checarFeriado(el) {
    var valor = (el.value || '').trim();
    if (!valor) {
        el.classList.remove('campo-fim-semana', 'campo-feriado');
        el.title = '';
        return;
    }
    var partes = valor.split('/');
    if (partes.length !== 3) {
        el.classList.remove('campo-fim-semana', 'campo-feriado');
        el.title = '';
        return;
    }
    var dia = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10) - 1;
    var ano = parseInt(partes[2], 10);
    var d = new Date(ano, mes, dia);
    if (isNaN(d.getTime()) || d.getDate() !== dia) {
        el.classList.remove('campo-fim-semana', 'campo-feriado');
        el.title = '';
        return;
    }

    var diaSemana = d.getDay();
    var isFimSemana = (diaSemana === 0 || diaSemana === 6);
    var isFeriado = feriadosDoAno.some(function(f) { return f === valor; });

    if (isFeriado) {
        el.classList.add('campo-feriado');
        el.title = '⚠️ Esta data é um feriado!';
    } else {
        el.classList.remove('campo-feriado');
        el.title = '';
    }

    if (isFimSemana) {
        el.classList.add('campo-fim-semana');
        if (!isFeriado) {
            el.title = '⚠️ Esta data cai em fim de semana!';
        }
    } else {
        el.classList.remove('campo-fim-semana');
        if (!isFeriado) {
            el.title = '';
        }
    }
}

function calcularDatasAuto() {
    var mesAno = document.getElementById('mesAnoFolha').value;
    if (!mesAno) { alert('Preencha o Mês/Ano da Folha primeiro.'); return; }
    var partes = mesAno.split('/');
    if (partes.length !== 2) { alert('Formato inválido. Use MM/AAAA.'); return; }
    var mes = parseInt(partes[0], 10);
    var ano = parseInt(partes[1], 10);
    if (isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12 || ano < 2000 || ano > 2100) {
        alert('Mês/Ano inválido.');
        return;
    }

    google.script.run
        .withSuccessHandler(function(res) {
            if (!res) {
                alert('Erro: O servidor não retornou os dados de cálculo.');
                return;
            }

            var mapa = {
                'dtCadastroFl20': 'cad_fl20',
                'dtContagem': 'contagem',
                'dtAntContagem': 'r_0916',
                'dtR3017': 'r_3017',
                'dtCalcFl20': 'fl20',
                'dtR0980': 'r_0980',
                'dtConfIniFl20': 'confere_fl20_ini',
                'dtInstrucoesFl': 'instrucoes_fl',
                'dtUltDiaEntregaDisk': 'ultimo_dia_entrega_disk',
                'dtAltFormulas': 'alt_formulas',
                'dtPrepI_II': 'preparacao_i_ii',
                'dtUltLancDps': 'ultimo_dia_lancamento_dps',
                'dtAtualContBanc': 'atualiza_conta_bancaria',
                'dtUltDiaCalendConsig': 'ultimo_dia_calend_consig',
                'dtPrepIII': 'preparacao_iii',
                'dtR0966': 'r_0966',
                'dtR1503': 'r_1503',
                'dtCargaConsig': 'consig_prefl_os31',
                'dtRetGrupos': 'pr_ret_group',
                'dtConsolFl20': 'consol_fl20',
                'prValorDebito': 'pr_valor_debito',
                'dtPrepIV': 'preparacao_iv',
                'confere_flnormal_ini': 'confere_flnormal_ini',
                'cad_fl_contra_debito': 'cad_fl_contra_debito',
                'consolidacao': 'consolidacao',
                'dtR1658': 'r_1658',
                'atu_pendencias': 'atu_pendencias',
                'dtConsigPreflOs33': 'consig_prefl_os33',
                'dtTransfArqBanc': 'transf_arq_bancarios',
                'dtCargaCchequeNet': 'carga_ccheque_net',
                'dtAnalisePendencias': 'analise_pendencias',
                'dtCarregaDadosContrib': 'carrega_dados_contribuicao',
                'pagamento': 'pagamento'
            };

            for (var id in mapa) {
                var el = document.getElementById(id);
                var valServidor = res[mapa[id]];
                if (el && valServidor !== undefined) {
                    el.value = valServidor;
                    el.classList.remove('campo-editado');
                }
            }

            var grupos = ['25430', '25429', '25428', '25427', '613230', '206660', '213229', '206680'];
            grupos.forEach(function(g) {
                var prefixos = ['1706', '1615'];
                prefixos.forEach(function(p) {
                    var sufixos = (p === '1615') ? ['_ini_audit', '_fim_audit', '_ini_atrib', '_fim_atrib'] : ['_ini', '_fim'];
                    sufixos.forEach(function(suf) {
                        var id = 'r_' + p + '_' + g + suf;
                        var el = document.getElementById(id);
                        if (el && res[id] !== undefined) {
                            el.value = res[id];
                            el.classList.remove('campo-editado');
                        }
                    });
                });
            });

            carregarFeriados(ano);
        })
        .withFailureHandler(function(err) {
            alert('Erro no servidor ao calcular datas:\n' + (err.message || err));
        })
        .apiCalcularDatasAuto(mesAno);
}

document.getElementById('mesAnoFolha').addEventListener('change', function() { calcularDatasAuto(); });

document.addEventListener('input', function(e) {
    if (e.target.classList && e.target.classList.contains('campo-calculo')) {
        e.target.classList.add('campo-editado');
        if (e.target.id !== 'dtR1658') {
            checarFeriado(e.target);
        }
    }
});

document.addEventListener('blur', function(e) {
    if (e.target.classList && e.target.classList.contains('campo-calculo') && e.target.id !== 'dtR1658') {
        checarFeriado(e.target);
    }
}, true);

document.getElementById('btnRecalcular').addEventListener('click', function() { calcularDatasAuto(); });

document.getElementById('formCronograma').addEventListener('submit', function(e) {
    e.preventDefault();
    var div = document.getElementById('resCronograma');
    div.className = 'alert alert-info mt-3';
    div.innerHTML = '<i class="bi bi-hourglass-split me-2"></i> Gerando cronograma...';
    div.style.display = 'block';

    var dados = {};
    var inputs = this.querySelectorAll('input');
    inputs.forEach(function(input) {
        dados[input.id] = input.value;
    });

    google.script.run
        .withSuccessHandler(function(res) {
            if (res && res._cookie) salvarCookie(res._cookie);
            if (res.sucesso) {
                if (res.conteudoBase64) {
                    var link = document.createElement('a');
                    link.href = 'data:application/pdf;base64,' + res.conteudoBase64;
                    link.download = res.nomeArquivo;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                div.className = 'alert alert-success mt-3';
                div.innerHTML = res.mensagem;
            } else {
                div.className = 'alert alert-danger mt-3';
                div.innerText = 'Erro: ' + (res.erro || 'Falha desconhecida');
            }
            div.style.display = 'block';
        })
        .withFailureHandler(function(err) {
            div.className = 'alert alert-danger mt-3';
            div.innerText = 'Erro de comunicação: ' + err;
            div.style.display = 'block';
        })
        .apiGerarCronograma(dados, obterCookie());
});

document.getElementById('btnLimparCronograma').addEventListener('click', function() {
    var form = document.getElementById('formCronograma');
    var inputs = form.querySelectorAll('input');
    inputs.forEach(function(input) {
        input.value = '';
        input.classList.remove('campo-editado', 'campo-fim-semana', 'campo-feriado');
        input.title = '';
    });
    document.getElementById('resCronograma').style.display = 'none';
    feriadosDoAno = [];
});

// ============================================================
// 6. ESTAGIÁRIOS
// ============================================================
document.getElementById('formEstagiarios').addEventListener('submit', function(e) {
    e.preventDefault();
    var mesAno = document.getElementById('mesAnoEstag').value.trim();
    if (!mesAno || !/^\d{2}\/\d{4}$/.test(mesAno)) {
        alert('Formato inválido. Use MM/YYYY (ex: 09/2026).');
        return;
    }

    document.getElementById('loaderEstag').style.display = 'block';
    document.getElementById('resEstagContainer').style.display = 'none';

    google.script.run
        .withSuccessHandler(function(res) {
            document.getElementById('loaderEstag').style.display = 'none';
            if (res && res._cookie) salvarCookie(res._cookie);
            if (res.sucesso) {
                renderizarTabelaEstag(res.dadosTabela || [], mesAno);
                document.getElementById('resEstagContainer').style.display = 'block';
            } else {
                alert('Erro: ' + (res.erro || res.mensagem || 'Falha desconhecida'));
            }
        })
        .withFailureHandler(function(err) {
            document.getElementById('loaderEstag').style.display = 'none';
            alert('Erro de comunicação: ' + err);
            document.getElementById('resEstagContainer').style.display = 'block';
        })
        .apiEstagiarios(mesAno, obterCookie());
});

function renderizarTabelaEstag(dados, mesAno) {
    var tbody = document.getElementById('bodyEstag');
    tbody.innerHTML = '';
    if (!dados || dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted py-4">Nenhum registro encontrado.</td></tr>';
        return;
    }
    dados.forEach(function(row) {
        var tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.matricula || ''}</td>
            <td>${row.nome || ''}</td>
            <td>${row.cargo || ''}</td>
            <td>${row.cpf || ''}</td>
            <td>${row.secretaria || ''}</td>
            <td>${row.secr || ''}</td>
            <td class="text-center">${formatarMoeda(row.bruto)}</td>
            <td class="text-center">${formatarMoeda(row.ir)}</td>
            <td class="text-center">${formatarMoeda(row.inss)}</td>
            <td class="text-center">${formatarMoeda(row.faltas)}</td>
            <td class="text-center">${formatarMoeda(row.liquido)}</td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById('tituloEstag').innerText = 'Liquidação de Estagiários - ' + mesAno;
    refreshTableFilter('tbEstag');
    if (!document.getElementById('tf-bar-tbEstag').dataset.tfInit) {
        tfCreateFilterBar('tbEstag');
        tfEnableSort('tbEstag');
    }
    document.getElementById('btnExportarEstagCSV').onclick = function() {
        exportarTabelaCSV('tbEstag', 'estagiarios_' + mesAno.replace('/', '_') + '.csv');
    };
}

// ============================================================
// 7. CARGA DE ARQUIVOS (mantido integralmente)
// ============================================================
(function() {
    const $ = id => document.getElementById(id);
    const runBtn = $('run-btn-carga');
    const runTxt = $('run-txt-carga');
    const runSpin = $('run-spin-carga');
    const runPill = $('run-pill-carga');
    const logBody = $('log-body-carga');
    const clearBtn = $('clear-btn-carga');

    const schedTime = $('sched-time-carga');
    const schedBtn = $('sched-btn-carga');
    const cancelBtn = $('cancel-btn-carga');
    const schedStTxt = $('sched-st-txt-carga');
    const schedSt = $('sched-st-carga');
    const schedPill = $('sched-pill-carga');

    const janelaDe = $('janela-de-carga');
    const janelaAte = $('janela-ate-carga');
    const janelaBtn = $('janela-btn-carga');
    const janelaCancelBtn = $('janela-cancel-btn-carga');
    const janelaStTxt = $('janela-st-txt-carga');
    const janelaSt = $('janela-st-carga');
    const janelaPill = $('janela-pill-carga');

    const excecaoDia = $('excecao-dia-carga');
    const excecaoBtn = $('excecao-btn-carga');
    const excecaoCancelBtn = $('excecao-cancel-btn-carga');

    function log(msg, type = '') {
        const ts = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const div = document.createElement('div');
        div.className = 'log-line';
        div.innerHTML = `<span class="log-ts">${ts}</span><span class="log-msg ${type}">${msg}</span>`;
        logBody.appendChild(div);
        logBody.scrollTop = logBody.scrollHeight;
    }

    clearBtn.addEventListener('click', () => { logBody.innerHTML = ''; });

    function callServer(fn, ...args) {
        return new Promise((resolve, reject) => {
            if (typeof google === 'undefined' || !google.script) {
                reject('Google Apps Script não disponível');
                return;
            }
            google.script.run
                .withSuccessHandler(resolve)
                .withFailureHandler(reject)[fn](...args);
        });
    }

    function setRunning(on) {
        runBtn.disabled = on;
        schedBtn.disabled = on;
        cancelBtn.disabled = on;
        schedTime.disabled = on;
        runSpin.style.display = on ? 'block' : 'none';
        if (on) {
            runBtn.classList.add('running');
            runTxt.textContent = 'Processando...';
            runPill.className = 'pill running';
            runPill.textContent = 'executando';
        } else {
            runBtn.classList.remove('running');
            runTxt.textContent = 'Executar processo completo';
            runPill.className = 'pill idle';
            runPill.textContent = 'idle';
        }
    }

    runBtn.addEventListener('click', async () => {
        setRunning(true);
        logBody.innerHTML = '';
        log('Iniciando processo manual...', 'inf');
        try {
            log('Verificando estrutura de pastas...');
            await callServer('web_criarEstruturaPastasOrgaos');
            log('Estrutura OK', 'ok');
            log('Processando arquivos...');
            const r = await callServer('web_executarProcessamentoCompleto');
            log(r, 'wrn');
            log('Processo finalizado com sucesso ✓', 'ok');
            runPill.className = 'pill ok';
            runPill.textContent = 'concluído';
        } catch (e) {
            log('Erro crítico: ' + (e.message || e), 'err');
            runPill.style.background = '#f8d7da';
            runPill.style.color = '#721c24';
            runPill.textContent = 'erro';
        } finally {
            setRunning(false);
        }
    });

    async function checkSched() {
        try {
            const s = await callServer('web_verificarAgendamento');
            schedStTxt.textContent = s || 'Sem agendamento ativo.';
            const on = s && s.toLowerCase().includes('agendado');
            schedSt.className = 'sched-status' + (on ? ' on' : '');
            schedSt.querySelector('i').className = 'bi bi-' + (on ? 'calendar-check' : 'clock');
            schedPill.className = 'pill' + (on ? ' ok' : ' idle');
            schedPill.textContent = on ? 'ativo' : 'inativo';
        } catch (e) {
            schedStTxt.textContent = 'Erro ao verificar.';
        }
    }

    schedBtn.addEventListener('click', async () => {
        const t = schedTime.value;
        if (!t) { log('Selecione um horário.', 'err'); return; }
        schedBtn.disabled = true;
        log('Agendando para ' + t + '…', 'inf');
        try {
            const r = await callServer('web_agendarProcessamento', t);
            log(r, 'ok');
            await checkSched();
        } catch (e) {
            log('Erro ao agendar: ' + (e.message || e), 'err');
        } finally {
            schedBtn.disabled = false;
        }
    });

    cancelBtn.addEventListener('click', async () => {
        cancelBtn.disabled = true;
        log('Cancelando agendamento…', 'wrn');
        try {
            const r = await callServer('web_cancelarAgendamento');
            log(r, 'ok');
            await checkSched();
        } catch (e) {
            log('Erro: ' + (e.message || e), 'err');
        } finally {
            cancelBtn.disabled = false;
        }
    });

    async function checkJanela() {
        try {
            const s = await callServer('web_verificarJanelaRecebimento');
            janelaStTxt.textContent = s || 'Nenhuma janela definida (recebendo o mês todo).';
            const on = s && s.toLowerCase().includes('ativa');
            janelaSt.className = 'sched-status' + (on ? ' on' : '');
            janelaSt.querySelector('i').className = 'bi bi-' + (on ? 'calendar-check' : 'calendar-week');
            janelaPill.className = 'pill' + (on ? ' ok' : ' idle');
            janelaPill.textContent = on ? 'ativa' : 'inativa';
        } catch (e) {
            janelaStTxt.textContent = 'Erro ao verificar.';
        }
    }

    janelaBtn.addEventListener('click', async () => {
        const de = parseInt(janelaDe.value, 10);
        const ate = parseInt(janelaAte.value, 10);
        if (!de || !ate || de < 1 || de > 31 || ate < 1 || ate > 31) {
            log('Informe os dois dias da janela (1 a 31).', 'err');
            return;
        }
        if (de > ate) { log('O dia inicial deve ser ≤ final.', 'err'); return; }
        janelaBtn.disabled = true;
        log('Definindo janela: ' + de + ' a ' + ate, 'inf');
        try {
            const r = await callServer('web_definirJanelaRecebimento', de, ate);
            log(r, 'ok');
            await checkJanela();
        } catch (e) {
            log('Erro: ' + (e.message || e), 'err');
        } finally {
            janelaBtn.disabled = false;
        }
    });

    janelaCancelBtn.addEventListener('click', async () => {
        janelaCancelBtn.disabled = true;
        log('Removendo janela…', 'wrn');
        try {
            const r = await callServer('web_removerJanelaRecebimento');
            log(r, 'ok');
            janelaDe.value = '';
            janelaAte.value = '';
            await checkJanela();
        } catch (e) {
            log('Erro: ' + (e.message || e), 'err');
        } finally {
            janelaCancelBtn.disabled = false;
        }
    });

    excecaoBtn.addEventListener('click', async () => {
        const dia = parseInt(excecaoDia.value, 10);
        if (!dia || dia < 1 || dia > 31) { log('Dia de exceção inválido.', 'err'); return; }
        excecaoBtn.disabled = true;
        log('Definindo exceção: até dia ' + dia, 'inf');
        try {
            const r = await callServer('web_definirExcecaoJanela', dia);
            log(r, 'ok');
            await checkJanela();
        } catch (e) {
            log('Erro: ' + (e.message || e), 'err');
        } finally {
            excecaoBtn.disabled = false;
        }
    });

    excecaoCancelBtn.addEventListener('click', async () => {
        excecaoCancelBtn.disabled = true;
        log('Removendo exceção…', 'wrn');
        try {
            const r = await callServer('web_removerExcecaoJanela');
            log(r, 'ok');
            excecaoDia.value = '';
            await checkJanela();
        } catch (e) {
            log('Erro: ' + (e.message || e), 'err');
        } finally {
            excecaoCancelBtn.disabled = false;
        }
    });

    log('Módulo Carga de Arquivos inicializado.', 'inf');
    checkSched();
    checkJanela();
})();

// ============================================================
// DASHBOARD CARGA DE ARQUIVOS
// ============================================================
(function() {
    const $ = id => document.getElementById(id);
    const secList = $('sec-list-carga');
    const logDaysList = $('log-days-list-carga');
    const monthFilterBtn = $('month-filter-btn-carga');
    const monthFilterLabel = $('month-filter-label-carga');
    const monthMenu = $('month-menu-carga');
    const secretariaSelect = $('secretaria-select-carga');
    const rubricaSelect = $('rubrica-select-carga');

    let MONTHS = [];
    let selectedMonth = '';
    let dashboardData = { secretarias: [] };
    let historicoData = [];
    let filtroSecretaria = 'todas';
    let filtroRubrica = 'todas';

    const fmtBR = n => 'R$ ' + n.toLocaleString('pt-BR');

    function getLastMonths(count = 6) {
        const months = [];
        const now = new Date();
        for (let i = 0; i < count; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            months.push({
                id: `${month}-${year}`,
                label: `${d.toLocaleString('pt-BR', { month: 'long' })}/${year}`
            });
        }
        return months;
    }

    function buildMonthMenu() {
        monthMenu.innerHTML = MONTHS.map(m =>
            `<div class="month-option${m.id === selectedMonth ? ' selected' : ''}" data-value="${m.id}">
                <i class="bi bi-check"></i><span>${m.label}</span>
             </div>`
        ).join('');
        monthMenu.querySelectorAll('.month-option').forEach(opt => {
            opt.addEventListener('mousedown', e => {
                e.preventDefault();
                selectedMonth = opt.dataset.value;
                filtroSecretaria = 'todas';
                filtroRubrica = 'todas';
                secretariaSelect.value = 'todas';
                rubricaSelect.value = 'todas';
                updateMonthLabel();
                closeMonthMenu();
                carregarDashboard();
            });
        });
    }

    function updateMonthLabel() {
        const m = MONTHS.find(m => m.id === selectedMonth);
        monthFilterLabel.textContent = m ? m.label : 'Mês';
        monthMenu.querySelectorAll('.month-option').forEach(o =>
            o.classList.toggle('selected', o.dataset.value === selectedMonth)
        );
    }

    function closeMonthMenu() {
        monthMenu.classList.remove('open');
        monthFilterBtn.classList.remove('open');
        monthFilterBtn.setAttribute('aria-expanded', 'false');
    }

    monthFilterBtn.addEventListener('click', () => {
        const willOpen = !monthMenu.classList.contains('open');
        monthMenu.classList.toggle('open', willOpen);
        monthFilterBtn.classList.toggle('open', willOpen);
        monthFilterBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    document.addEventListener('mousedown', e => {
        const filter = document.getElementById('month-filter-carga');
        if (filter && !filter.contains(e.target)) closeMonthMenu();
    });

    function callServer(fn, ...args) {
        return new Promise((resolve, reject) => {
            if (typeof google === 'undefined' || !google.script) {
                reject('Google Apps Script não disponível');
                return;
            }
            google.script.run
                .withSuccessHandler(resolve)
                .withFailureHandler(reject)[fn](...args);
        });
    }

    async function fetchDashboardData(month) {
        try {
            const data = await callServer('web_obterDadosDashboard', month);
            return data;
        } catch (e) {
            console.error('Erro ao buscar dados do dashboard:', e);
            return { secretarias: [] };
        }
    }

    async function fetchHistorico() {
        try {
            const data = await callServer('web_obterHistoricoExecucoes');
            return data;
        } catch (e) {
            console.error('Erro ao buscar histórico:', e);
            return [];
        }
    }

    function renderSecretarias() {
        let secretariasFiltradas = dashboardData.secretarias;
        if (filtroSecretaria !== 'todas') {
            secretariasFiltradas = secretariasFiltradas.filter(sec => sec.sigla === filtroSecretaria);
        }
        if (filtroRubrica !== 'todas') {
            secretariasFiltradas = secretariasFiltradas.map(sec => {
                const rubricasFiltradas = sec.rubricas.filter(rub => rub.rubrica === filtroRubrica);
                return { ...sec, rubricas: rubricasFiltradas };
            }).filter(sec => sec.rubricas.length > 0);
        }
        if (!secretariasFiltradas || secretariasFiltradas.length === 0) {
            secList.innerHTML = '<div class="sec-empty">Nenhum dado corresponde aos filtros selecionados.</div>';
            return;
        }
        secList.innerHTML = secretariasFiltradas.map(sec =>
            `<div class="sec-item">
                <div class="sec-head">
                    <div class="sec-head-left">
                        <div class="sec-sigla-badge">${sec.sigla.slice(0,5)}</div>
                        <div class="sec-names">
                            <span class="sec-sigla">${sec.sigla}</span>
                            <span class="sec-nome">${sec.nome}</span>
                        </div>
                    </div>
                    <div class="sec-head-right">
                        <span class="sec-count">${sec.rubricas.length} rubrica${sec.rubricas.length!==1?'s':''}</span>
                    </div>
                </div>
                <div class="sec-body"><div class="sec-body-inner">${rubricasBodyHTML(sec.rubricas)}</div></div>
            </div>`
        ).join('');
    }

    function rubricasBodyHTML(rubricas) {
        if (!rubricas.length) return '<div class="sec-empty">Nenhuma rubrica cadastrada</div>';
        const maxVal = Math.max(...rubricas.flatMap(r => [r.volume, r.teto])) || 1;
        return rubricas.map(r => {
            const volume = r.volume || 0;
            const teto = r.teto || 0;
            const volPct = maxVal ? (volume / maxVal * 100) : 0;
            const tetoPct = 100;
            let detailHtml;
            if (r.arquivos && r.arquivos.length) {
                detailHtml = r.arquivos.map(arquivoCardHTML).join('');
            } else if (volume > 0) {
                detailHtml = '<div class="rub-empty" style="color:#b45309">⚠️ Volume registrado, mas a lista de arquivos não está disponível.</div>';
            } else {
                detailHtml = '<div style="text-align:center;padding:0.5rem 0;"><span class="badge-empty">Nenhum arquivo recebido neste mês</span></div>';
            }
            return `<div class="rub-item">
                <div class="rub-head">
                    <div class="rub-label">${r.rubrica}</div>
                    <div class="rub-bars">
                        <div class="rub-bar-track"><div class="track-bg"><div class="track-fill vol" style="width:${volPct}%"></div></div><span class="track-val">${fmtBR(volume)}</span></div>
                        <div class="rub-bar-track"><div class="track-bg"><div class="track-fill teto" style="width:${tetoPct}%"></div></div><span class="track-val">${fmtBR(teto)}</span></div>
                    </div>
                </div>
                <div class="rub-detail"><div class="rub-detail-inner">${detailHtml}</div></div>
            </div>`;
        }).join('');
    }

    function arquivoCardHTML(a) {
        const warning = a.observacao
            ? `<div class="arq-warning"><i class="bi bi-exclamation-triangle"></i><span>${a.observacao}</span></div>`
            : '';
        return `<div class="arq-item">
            <div class="arq-head">
                <i class="bi bi-file-text"></i>
                <span>${a.nome}</span>
                ${a.observacao ? '<i class="bi bi-exclamation-triangle" style="color:#b45309;margin-left:auto;"></i>' : ''}
            </div>
            <div class="arq-meta">
                <div class="arq-meta-row"><span class="arq-meta-label">Valor</span><span class="arq-meta-val">${fmtBR(a.valor)}</span></div>
                <div class="arq-meta-row"><span class="arq-meta-label">Competência</span><span class="arq-meta-val">${a.competencia}</span></div>
                <div class="arq-meta-row"><span class="arq-meta-label">Processado em</span><span class="arq-meta-val">${a.processado}</span></div>
                ${a.complemento ? `<div class="arq-meta-row"><span class="arq-meta-label">Complemento</span><span class="arq-meta-val">${a.complemento}</span></div>` : ''}
            </div>
            ${warning}
        </div>`;
    }

    function renderHistorico() {
        if (!historicoData || historicoData.length === 0) {
            logDaysList.innerHTML = '<div class="sec-empty">Nenhuma execução registrada ainda.</div>';
            return;
        }
        logDaysList.innerHTML = historicoData.map(d => {
            const isManual = d.tipo === 'Manual';
            const icon = isManual ? 'bi-bolt' : 'bi-calendar-event';
            const badgeClass = isManual ? 'purple' : 'teal';
            const n = d.arquivosProcessados;
            const arquivosCount = (d.arquivos || []).length;
            const issueCount = (d.arquivos || []).filter(a => a.status !== 'Aceito').length;

            const arquivosLabel = n + (n === 1 ? ' arquivo' : ' arquivos');
            let statusPillClass, statusPillContent;
            if (d.status === 'err') {
                statusPillClass = 'pill err';
                statusPillContent = `<i class="bi bi-exclamation-circle"></i>${arquivosLabel}`;
            } else if (d.status === 'warn') {
                statusPillClass = 'pill wrn';
                statusPillContent = `<i class="bi bi-exclamation-triangle"></i>${arquivosLabel}`;
            } else {
                statusPillClass = 'pill ok';
                statusPillContent = arquivosLabel;
            }
            const tabBadge = d.status === 'err'
                ? `<span class="tab-badge">${issueCount}</span>`
                : (d.status === 'warn' ? `<span class="tab-badge warn-badge">${issueCount}</span>` : '');
            return `<div class="hist-item">
                <button class="hist-head" type="button" aria-expanded="false">
                    <div class="sec-head-left">
                        <div class="log-badge ${badgeClass}"><i class="bi ${icon}"></i></div>
                        <div class="sec-names">
                            <span class="sec-sigla">${d.dataHora}</span>
                            <span class="sec-nome">${d.tipo}</span>
                        </div>
                    </div>
                    <div class="sec-head-right">
                        <span class="${statusPillClass}">${statusPillContent}</span>
                        <i class="bi bi-chevron-down hist-chevron"></i>
                    </div>
                </button>
                <div class="hist-body"><div class="hist-body-inner">
                    <div class="day-tabs">
                        <button class="day-tab active" data-tab="log" type="button"><i class="bi bi-terminal"></i> Log</button>
                        <button class="day-tab" data-tab="arquivos" type="button"><i class="bi bi-files"></i> Arquivos${arquivosCount ? ' ('+arquivosCount+')' : ''}${tabBadge}</button>
                    </div>
                    <div class="day-content active" data-content="log">${logLinesHTML(d.lines)}</div>
                    <div class="day-content" data-content="arquivos">${arquivosBodyHTML(d)}</div>
                </div></div>
            </div>`;
        }).join('');

        document.querySelectorAll('#log-days-list-carga .hist-item').forEach(item => {
            item.querySelector('.hist-head').addEventListener('click', () => {
                const isOpen = item.classList.toggle('open');
                item.querySelector('.hist-head').setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
            item.querySelectorAll('.day-tab').forEach(tabBtn => {
                tabBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const tab = tabBtn.dataset.tab;
                    item.querySelectorAll('.day-tab').forEach(t => t.classList.toggle('active', t === tabBtn));
                    item.querySelectorAll('.day-content').forEach(c => c.classList.toggle('active', c.dataset.content === tab));
                });
            });
        });
    }

    function logLinesHTML(lines) {
        return `<div class="mini-log">` +
            lines.map(l =>
                `<div class="log-line"><span class="log-ts">${l.time}</span><span class="log-msg ${l.type}">${l.msg}</span></div>`
            ).join('') +
            `</div>`;
    }

    function arquivosBodyHTML(d) {
        if (!d.arquivos || !d.arquivos.length) return '<div class="rub-empty">Nenhum arquivo registrado nesta execução</div>';
        return `<div class="arq-list-log">${d.arquivos.map(arquivoLogItemHTML).join('')}</div>`;
    }

    function arquivoLogItemHTML(a) {
        const icon = a.status === 'Aceito' ? 'bi-check-circle' : (a.status === 'Rejeitado' ? 'bi-exclamation-circle' : 'bi-exclamation-triangle');
        const resumo = (a.status !== 'Aceito' && a.motivo)
            ? `<div class="arq-log-resumo"><i class="bi ${icon}"></i><span>${a.motivo}</span></div>`
            : '';
        const warning = a.observacao
            ? `<div class="arq-warning"><i class="bi bi-exclamation-triangle"></i><span>${a.observacao}</span></div>`
            : '';
        const meta = `<div class="arq-meta-log">
            <div class="arq-meta-row"><span class="arq-meta-label">Valor</span><span class="arq-meta-val">${fmtBR(a.valor)}</span></div>
            <div class="arq-meta-row"><span class="arq-meta-label">Competência</span><span class="arq-meta-val">${a.competencia}</span></div>
            ${a.complemento ? `<div class="arq-meta-row"><span class="arq-meta-label">Complemento</span><span class="arq-meta-val">${a.complemento}</span></div>` : ''}
        </div>`;
        return `<div class="arq-item-log status-${a.status === 'Aceito' ? 'ok' : (a.status === 'Rejeitado' ? 'err' : 'warn')}">
            <div class="arq-log-head">
                <i class="bi bi-file-text arq-log-icon"></i>
                <span class="arq-log-name">${a.nome}</span>
                ${a.observacao ? '<i class="bi bi-exclamation-triangle arq-log-icon" style="color:#b45309;"></i>' : ''}
                <i class="bi ${icon} arq-log-icon"></i>
            </div>
            ${meta}
            ${resumo}
            ${warning}
        </div>`;
    }

    async function carregarDashboard() {
        dashboardData = await fetchDashboardData(selectedMonth);
        const secSet = new Set();
        dashboardData.secretarias.forEach(sec => secSet.add(sec.sigla));
        const rubSet = new Set();
        dashboardData.secretarias.forEach(sec => sec.rubricas.forEach(rub => rubSet.add(rub.rubrica)));

        const currentSec = secretariaSelect.value;
        const currentRub = rubricaSelect.value;
        secretariaSelect.innerHTML = '<option value="todas">Todas as Secretarias</option>' +
            Array.from(secSet).sort().map(s => `<option value="${s}">${s}</option>`).join('');
        rubricaSelect.innerHTML = '<option value="todas">Todas as Rubricas</option>' +
            Array.from(rubSet).sort().map(r => `<option value="${r}">${r}</option>`).join('');
        secretariaSelect.value = currentSec || 'todas';
        rubricaSelect.value = currentRub || 'todas';

        historicoData = await fetchHistorico();
        renderSecretarias();
        renderHistorico();
        MONTHS = getLastMonths(6);
        buildMonthMenu();
        updateMonthLabel();
    }

    secretariaSelect.addEventListener('change', () => {
        filtroSecretaria = secretariaSelect.value;
        renderSecretarias();
    });
    rubricaSelect.addEventListener('change', () => {
        filtroRubrica = rubricaSelect.value;
        renderSecretarias();
    });

    MONTHS = getLastMonths(6);
    selectedMonth = MONTHS[0].id;
    buildMonthMenu();
    updateMonthLabel();

    const tabDashboard = document.getElementById('carga-tab-dashboard');
    tabDashboard.addEventListener('shown.bs.tab', function() {
        carregarDashboard();
    });
    if (document.getElementById('cargaDashboard').classList.contains('show')) {
        carregarDashboard();
    }
})();

// ============================================================
// UTILITÁRIOS
// ============================================================
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

function tratarErro(err) {
    alert("Erro: " + err);
    console.error(err);
}

function downloadTxtOutput() {
    var conteudo = document.getElementById('txtCargaOutput').innerText;
    var blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "carga_eleitos_ergon.txt";
    a.click();
}

function exportarTabelaCSV(tableId, filename) {
    var table = document.getElementById(tableId);
    var rows = table.querySelectorAll("tr");
    var csv = [];
    for (var i = 0; i < rows.length; i++) {
        var row = [],
            cols = rows[i].querySelectorAll("td, th");
        for (var j = 0; j < cols.length; j++)
            row.push('"' + cols[j].innerText.replace(/"/g, '""') + '"');
        csv.push(row.join(";"));
    }
    var csvFile = new Blob(["\ufeff" + csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    var downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.click();
}

function downloadCSV(tableId, filename) {
    var table = document.getElementById(tableId);
    if (!table) return;
    var rows = table.querySelectorAll('tr');
    var csv = [];
    for (var i = 0; i < rows.length; i++) {
        var row = [];
        var cols = rows[i].querySelectorAll('td, th');
        for (var j = 0; j < cols.length; j++) {
            var text = cols[j].innerText.replace(/"/g, '""');
            row.push('"' + text + '"');
        }
        csv.push(row.join(';'));
    }
    var blob = new Blob(['\ufeff' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// ============================================================
// INICIALIZAÇÃO GERAL
// ============================================================
window.addEventListener('load', function() {
    var mesAno = document.getElementById('mesAnoFolha').value;
    if (mesAno) { calcularDatasAuto(); }
});

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('resRetencoesContainer').style.display = 'none';
});