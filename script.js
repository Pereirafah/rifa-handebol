
const numerosContainer = document.getElementById('numerosContainer');
const numerosSelecionadosInput = document.getElementById('numerosSelecionados');
const totalCompraDiv = document.getElementById('totalCompra');
const form = document.getElementById('supportForm');
const messageDiv = document.getElementById('message');
const paymentMethodSelect = document.getElementById('paymentMethod');
const phoneInput = document.getElementById('phone');

const VALOR_NUMERO = 10;

const nomes = [
  "Maria", "Graziela", "Claudia", "Regiane", "Vilma", "Fernanda", "Emília", "Daniela", "Sandra", "Zuleika",
  "Marisa", "Emanoele", "Dolores", "Celina", "Tereza", "Solange", "Ângela", "Guiomar", "Margot", "Dalila",
  "Anadark", "Cristina", "Débora", "Eliane", "Genilda", "Rosália", "Simone", "Helena", "Valquíria", "Andréa",
  "Cleide", "Elaine", "Roberta", "Glória", "Suzana", "Adriana", "Olga", "Izabel", "Juliana", "Kátia",
  "Irene", "Jurema", "Letícia", "Marta", "Paula", "Marcela", "Olívia", "Joana", "Lenice", "Fátima",
  "Rosimeire", "Denise", "Elizabeth", "Claudete", "Regina", "Celeste", "Aurora", "Rosângela", "Lourdes", "Isaura",
  "Mônica", "Leonor", "Janete", "Raquel", "Virgínia", "Camila", "Roseli", "Valéria", "Adelaide", "Salete",
  "Zulmira", "Sheila", "Cleuza", "Antônia", "Joelma", "Iolanda", "Miriam", "Olinda", "Norma", "Luciana",
  "Alessandra", "Clarice", "Sônia", "Dirce", "Marlene", "Jaqueline", "Noêmia", "Margarida", "Patrícia", "Estela",
  "Dinorá", "Márcia", "Rosana", "Silvana", "Neuza", "Margarete", "Eugênia", "Renata", "Nazaré", "Mirtes"
];

const MAX_NUMEROS = nomes.length;

let numerosSelecionados = new Set();

// Criar botões com os nomes
nomes.forEach((nome) => {
  const btn = document.createElement('button');
  btn.type = "button";
  btn.textContent = nome;
  btn.value = nome;
  btn.classList.add('numero-btn');
  btn.addEventListener('click', () => {
    if (numerosSelecionados.has(nome)) {
      numerosSelecionados.delete(nome);
      btn.classList.remove('selected');
    } else {
      if (numerosSelecionados.size >= MAX_NUMEROS) {
        alert(`Você pode escolher até ${MAX_NUMEROS} nomes.`);
        return;
      }
      numerosSelecionados.add(nome);
      btn.classList.add('selected');
    }
    atualizarNumerosSelecionados();
  });
  numerosContainer.appendChild(btn);
});

function atualizarNumerosSelecionados() {
  const arr = Array.from(numerosSelecionados).sort();
  numerosSelecionadosInput.value = arr.join(', ');
  if (arr.length > 0) {
    totalCompraDiv.textContent = `Você escolheu ${arr.length} pessoa(s). Total: R$ ${(arr.length * VALOR_NUMERO).toFixed(2)}`;
  } else {
    totalCompraDiv.textContent = '';
  }
}

// Formata telefone
function formatPhone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';

  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0,2)}) ${digits.slice(2,3)}${digits.slice(3,7)}-${digits.slice(7,11)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,3)}${digits.slice(3,7)}-${digits.slice(7,11)}`;
}

phoneInput.addEventListener('input', (e) => {
  const cursorPos = phoneInput.selectionStart;
  const beforeLength = phoneInput.value.length;

  phoneInput.value = formatPhone(phoneInput.value);

  const afterLength = phoneInput.value.length;
  const diff = afterLength - beforeLength;
  phoneInput.selectionStart = phoneInput.selectionEnd = cursorPos + diff;
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  messageDiv.textContent = '';

  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  const participate = form.participate.value;
  const paymentMethod = paymentMethodSelect.value;
  const nomesArray = Array.from(numerosSelecionados).sort();

  if (!name || !phone || !participate) {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Por favor, preencha todos os campos obrigatórios.';
    return;
  }

  if (participate === 'Sim' && nomesArray.length === 0) {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Escolha pelo menos uma pessoa da lista.';
    return;
  }

  if (paymentMethod === '') {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Escolha a forma de pagamento.';
    return;
  }

  // Montar mensagem para WhatsApp
  let msg = `Olá! Quero participar da rifa do Time Sales.\n\n`;
  msg += `Nome: ${name}\n`;
  msg += `Telefone para contato: ${phone}\n`;
  msg += `Participar da rifa: ${participate}\n`;
  msg += `Forma de pagamento: ${paymentMethod}\n`;
  if (participate === 'Sim') {
    msg += `Pessoas escolhidas: ${nomesArray.join(', ')}\n`;
    msg += `Valor total: R$ ${(nomesArray.length * VALOR_NUMERO).toFixed(2)}\n`;
  }
  msg += `\nObrigado!`;

  const encodedMsg = encodeURIComponent(msg);
  const whatsappNumber = "5518998098825";
  const urlWhats = `https://wa.me/${whatsappNumber}?text=${encodedMsg}`;

  window.open(urlWhats, '_blank');

  form.reset();
  numerosSelecionados.clear();
  atualizarNumerosSelecionados();
  messageDiv.style.color = 'green';
  messageDiv.textContent = 'Abrindo WhatsApp para enviar seu pedido...';
});

// Copiar chave Pix (se ainda estiver usando)
document.getElementById('copyPixBtn')?.addEventListener('click', () => {
  const pixKey = document.getElementById('pixKey').textContent.trim();
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(pixKey).then(() => {
      alert('Chave Pix copiada para a área de transferência!');
    }, () => {
      alert('Falha ao copiar a chave Pix.');
    });
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = pixKey;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert('Chave Pix copiada para a área de transferência!');
    } catch {
      alert('Falha ao copiar a chave Pix.');
    }
    document.body.removeChild(textArea);
  }
});
