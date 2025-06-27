const numerosContainer = document.getElementById('numerosContainer');
const numerosSelecionadosInput = document.getElementById('numerosSelecionados');
const totalCompraDiv = document.getElementById('totalCompra');
const form = document.getElementById('supportForm');
const messageDiv = document.getElementById('message');
const paymentMethodSelect = document.getElementById('paymentMethod');
const pixUploadDivForm = document.getElementById('pixUploadDivForm');
const phoneInput = document.getElementById('phone');

const VALOR_NUMERO = 10;
const MAX_NUMEROS = 5;

let numerosSelecionados = new Set();

// Criar botões para números de 1 a 100
for (let i = 1; i <= 100; i++) {
  const btn = document.createElement('button');
  btn.type = "button";
  btn.textContent = i.toString().padStart(2, '0');
  btn.value = i;
  btn.classList.add('numero-btn');
  btn.addEventListener('click', () => {
    if (numerosSelecionados.has(i)) {
      numerosSelecionados.delete(i);
      btn.classList.remove('selected');
    } else {
      if (numerosSelecionados.size >= MAX_NUMEROS) {
        alert(`Você pode escolher até ${MAX_NUMEROS} números.`);
        return;
      }
      numerosSelecionados.add(i);
      btn.classList.add('selected');
    }
    atualizarNumerosSelecionados();
  });
  numerosContainer.appendChild(btn);
}

function atualizarNumerosSelecionados() {
  const arr = Array.from(numerosSelecionados).sort((a,b) => a-b);
  numerosSelecionadosInput.value = arr.join(',');
  if (arr.length > 0) {
    totalCompraDiv.textContent = `Você escolheu ${arr.length} número(s). Total: R$ ${(arr.length * VALOR_NUMERO).toFixed(2)}`;
  } else {
    totalCompraDiv.textContent = '';
  }
}

// Mostrar/esconder campo de comprovante Pix
paymentMethodSelect.addEventListener('change', () => {
  if (paymentMethodSelect.value === 'Pix') {
    pixUploadDivForm.style.display = 'block';
    document.getElementById('pixProof').required = true;
  } else {
    pixUploadDivForm.style.display = 'none';
    document.getElementById('pixProof').required = false;
  }
});

// Formata telefone para (XX) 9XXXX-XXXX enquanto digita
function formatPhone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';

  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 7) {
    return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 11) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,3)}${digits.slice(3,7)}-${digits.slice(7,11)}`;
  }
  // Caso tenha mais que 11 dígitos, corta o excedente
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
  const numerosArray = Array.from(numerosSelecionados).sort((a,b) => a-b);

  // Validações simples
  if (!name || !phone || !participate) {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Por favor, preencha todos os campos obrigatórios.';
    return;
  }

  if (participate === 'Sim' && numerosArray.length === 0) {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Escolha pelo menos um número da rifa.';
    return;
  }

  if (paymentMethod === '') {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Escolha a forma de pagamento.';
    return;
  }

  if (paymentMethod === 'Pix') {
    const pixProof = document.getElementById('pixProof').files[0];
    if (!pixProof) {
      messageDiv.style.color = 'red';
      messageDiv.textContent = 'Por favor, anexe o comprovante do Pix.';
      return;
    }
  }

  // Montar mensagem para WhatsApp
  let msg = `Olá! Quero participar da rifa do Time Sales.\n\n`;
  msg += `Nome: ${name}\n`;
  msg += `Telefone para contato: ${phone}\n`;
  msg += `Participar da rifa: ${participate}\n`;
  msg += `Forma de pagamento: ${paymentMethod}\n`;
  if (participate === 'Sim') {
    msg += `Números escolhidos: ${numerosArray.join(', ')}\n`;
    msg += `Valor total: R$ ${(numerosArray.length * VALOR_NUMERO).toFixed(2)}\n`;
  }
  msg += `\nObrigado!`;

  const encodedMsg = encodeURIComponent(msg);
  const whatsappNumber = "5518998098825"; // Seu número sem sinais e com DDD

  const urlWhats = `https://wa.me/${whatsappNumber}?text=${encodedMsg}`;

  // Abrir WhatsApp em nova aba
  window.open(urlWhats, '_blank');

  // Opcional: limpar formulário e seleção
  form.reset();
  numerosSelecionados.clear();
  atualizarNumerosSelecionados();
  pixUploadDivForm.style.display = 'none';
  messageDiv.style.color = 'green';
  messageDiv.textContent = 'Abrindo WhatsApp para enviar seu pedido...';
});

// Botão copiar chave Pix
document.getElementById('copyPixBtn').addEventListener('click', () => {
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
