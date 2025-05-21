let tarefas = [];
let temaAtual = 'azul'; 
let editandoId = null;
let filtroAtual = 'todas'; // Variável para armazenar o filtro atual

function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano.slice(-2)}`;
}

function parseData(dataString) {
    const [dia, mes, ano] = dataString.split('/');
    return `20${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

function atualizarURL() {
    const estado = JSON.stringify({ tarefas, temaAtual });
    window.history.replaceState(null, null, `#${btoa(estado)}`);
    localStorage.setItem('cronograma', estado);
}

function carregarEstado() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        try {
            const estado = JSON.parse(atob(hash));
            tarefas = estado.tarefas;
            temaAtual = estado.temaAtual;
            document.body.setAttribute('data-tema', temaAtual);
        } catch (e) {
            console.error('Erro ao carregar estado:', e);
        }
    } else {
        const estadoLocal = localStorage.getItem('cronograma');
        if (estadoLocal) {
            const estado = JSON.parse(estadoLocal);
            tarefas = estado.tarefas;
            temaAtual = estado.temaAtual;
            document.body.setAttribute('data-tema', temaAtual);
        }
    }
    atualizarLista();
}

function alternarTemas() {
    const temas = ['rosa', 'azul', 'verde', 'amarelo', 'laranja', 'violeta'];
    temaAtual = temas[(temas.indexOf(temaAtual) + 1) % temas.length];
    document.body.setAttribute('data-tema', temaAtual);
    atualizarURL();
}

function manipularTarefa(event) {
    event.preventDefault();
    
    const dados = {
        id: editandoId || Date.now(),
        data: formatarData(document.getElementById('data').value),
        hora: document.getElementById('hora').value,
        descricao: document.getElementById('descricao').value,
        prioridade: document.getElementById('prioridade').value,
        concluida: false
    };

    if (editandoId) {
        const index = tarefas.findIndex(t => t.id === editandoId);
        tarefas[index] = { ...tarefas[index], ...dados };
        editandoId = null;
    } else {
        tarefas.push(dados);
    }

    event.target.reset();
    document.getElementById('botaoAcao').innerHTML = '<i class="fas fa-plus"></i> Adicionar';
    document.getElementById('botaoCancelar').style.display = 'none';
    atualizarLista();
    atualizarURL();
}

function editarTarefa(id) {
    const tarefa = tarefas.find(t => t.id === id);
    if (!tarefa) return;

    editandoId = id;
    document.getElementById('data').value = parseData(tarefa.data);
    document.getElementById('hora').value = tarefa.hora;
    document.getElementById('descricao').value = tarefa.descricao;
    document.getElementById('prioridade').value = tarefa.prioridade;
    
    document.getElementById('botaoAcao').innerHTML = '<i class="fas fa-save"></i> Salvar';
    document.getElementById('botaoCancelar').style.display = 'inline-block';
}

function cancelarEdicao() {
    editandoId = null;
    document.querySelector('form').reset();
    document.getElementById('botaoAcao').innerHTML = '<i class="fas fa-plus"></i> Adicionar';
    document.getElementById('botaoCancelar').style.display = 'none';
}

function atualizarLista() {
    const lista = document.getElementById('listaTarefas');
    lista.innerHTML = '';

    // Filtrar tarefas com base no filtro atual
    const tarefasFiltradas = tarefas.filter(tarefa => {
        if (filtroAtual === 'pendentes') return !tarefa.concluida;
        if (filtroAtual === 'concluidas') return tarefa.concluida;
        return true; // 'todas'
    });

    tarefasFiltradas.sort((a, b) => {
        const dataA = new Date(parseData(a.data));
        const dataB = new Date(parseData(b.data));
        return dataA - dataB || a.hora.localeCompare(b.hora);
    });

    tarefasFiltradas.forEach(tarefa => {
        const elemento = document.createElement('div');
        elemento.className = `tarefa ${tarefa.concluida ? 'concluida' : ''}`;
        elemento.innerHTML = `
            <div class="prioridade ${tarefa.prioridade}"></div>
            <div class="conteudo-tarefa">
                <div class="data-hora">${tarefa.data} ⏰ ${tarefa.hora}</div>
                <div class="descricao">${tarefa.descricao}</div>
            </div>
            <div class="acoes-tarefa">
                <i class="icone fas fa-check" onclick="toggleConcluida(${tarefa.id})"></i>
                <i class="icone fas fa-edit" onclick="editarTarefa(${tarefa.id})"></i>
                <i class="icone fas fa-trash" onclick="excluirTarefa(${tarefa.id})"></i>
            </div>
        `;
        lista.appendChild(elemento);
    });

    document.getElementById('contador').textContent = 
        `Tarefas restantes: ${tarefasFiltradas.filter(t => !t.concluida).length} de ${tarefasFiltradas.length}`;
}

function toggleConcluida(id) {
    const tarefa = tarefas.find(t => t.id === id);
    tarefa.concluida = !tarefa.concluida;
    atualizarLista();
    atualizarURL();
    verificarTarefasAtrasadas(); // Verifica se há tarefas atrasadas após a conclusão
}

function excluirTarefa(id) {
    tarefas = tarefas.filter(t => t.id !== id);
    atualizarLista();
    atualizarURL();
}

function compartilhar() {
    navigator.clipboard.writeText(window.location.href);
    mostrarNotificacao('Link copiado para a área de transferência!');
}

function mostrarNotificacao(mensagem) {
    const notificacao = document.getElementById('notificacao');
    const notificacaoTexto = document.getElementById('notificacaoTexto');
    notificacaoTexto.innerText = mensagem;
    notificacao.classList.add('mostrar');
    setTimeout(() => {
        notificacao.classList.remove('mostrar');
    }, 3000);
}

function fecharNotificacao() {
    const notificacao = document.getElementById('notificacao');
    notificacao.classList.remove('mostrar');
}

function verificarTarefasAtrasadas() {
    const agora = new Date().getTime();
    const tarefasAtrasadas = tarefas.filter(tarefa => 
        !tarefa.concluida && new Date(parseData(tarefa.data) + ' ' + tarefa.hora).getTime() < agora
    );

    if (tarefasAtrasadas.length > 0) {
        mostrarNotificacao(`Você tem ${tarefasAtrasadas.length} tarefa(s) atrasada(s)!`);
    }
}

// Função para filtrar tarefas
function filtrarTarefas(tipo) {
    filtroAtual = tipo; // Atualiza o filtro atual
    atualizarLista(); // Atualiza a lista de tarefas com o novo filtro
}

window.onload = () => {
    carregarEstado();
    verificarTarefasAtrasadas();
};
