// Config Firebase - coloque suas credenciais abaixo
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

const form = document.getElementById('supportForm');
const messageDiv = document.getElementById('message');
const paymentMethodSelect = document.getElementById('paymentMethod');
const pixUploadDiv = document.getElementById('pixUploadDiv');
const numerosContainer = document.getElementById('numerosContainer');
const numerosSelecionadosInput = document.getElementById('numerosSelecionados');
const totalCompraDiv = document.getElementById('totalCompra');
const pixPaymentLinkDiv = document.getElementById('pixPaymentLink');
const boughtNumbersDiv = document.getElementById('boughtNumbers');

const PIX_CHAVE = "5d7e9815-4788-4854-96c6-eef5f8f9018a";
const VALOR_NUMERO = 10;
const maxNumeros = 100;

let numerosSelecionados = new Set();

paymentMethodSelect.addEventListener('change', () => {
  if(paymentMethodSelect.value === 'Pix') {
    pixUploadDiv.style.display = 'block';
    document.getElementById('pixProof').required = true;
  } else {
    pixUploadDiv.style.display = 'none';
    document.getElementById('pixProof').required = false;
  }
  atualizarNumerosSelecionados();
});

async function carregarNumerosDisponiveis() {
  numerosContainer.innerHTML = '<p>Carregando números disponíveis...</p>';
  const snapshot = await db.collection('numerosRifa').get();
  const numerosReservados = new Set();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.status === 'pendente' || data.status === 'confirmado') {
      numerosReservados.add(data.numero);
    }
  });

  numerosContainer.innerHTML = '';
  for(let i=1; i<= maxNumeros; i++) {
    if (!numerosReservados.has(i)) {
      const btn = document.createElement('button');
      btn.type = "button";
      btn.textContent = i;
      btn.value = i;
      btn.classList.add('numero-btn');
      btn.onclick = () => {
        if(numerosSelecionados.has(i)) {
          numerosSelecionados.delete(i);
          btn.classList.remove('selected');
        } else {
          numerosSelecionados.add(i);
          btn.classList.add('selected');
        }
        atualizarNumerosSelecionados();
      };
      numerosContainer.appendChild(btn);
    }
  }

  if(numerosContainer.children.length === 0) {
    numerosContainer.innerHTML = '<p>Todos os números foram reservados.</p>';
  }
}

function atualizarNumerosSelecionados() {
  const numerosArray = Array.from(numerosSelecionados).sort((a,b) => a - b);
  numerosSelecionadosInput.value = numerosArray.join(',');

  if (numerosArray.length > 0) {
    const total = numerosArray.length * VALOR_NUMERO;
    totalCompraDiv.textContent = `Você escolheu os números: ${numerosArray.join(', ')}. Total: R$ ${total},00`;

    if(paymentMethodSelect.value === 'Pix') {
      const linkPix = gerarLinkPix(PIX_CHAVE, total, "Pagamento Rifa Time Sales");
      pixPaymentLinkDiv.innerHTML = `<a href="${linkPix}" target="_blank" rel="noopener noreferrer">Pagar via Pix</a>`;
    } else {
      pixPaymentLinkDiv.innerHTML = '';
    }

    numerosSelecionadosInput.required = true;
  } else {
    totalCompraDiv.textContent = '';
    pixPaymentLinkDiv.innerHTML = '';
    numerosSelecionadosInput.required = false;
  }
}

function gerarLinkPix(chave, valor, descricao) {
  // Monta um link pix simples para abrir apps Pix
  const descricaoEncoded = encodeURIComponent(descricao);
  return `pix://pix?chave=${chave}&valor=${valor.toFixed(2)}&msg=${descricaoEncoded}`;
}

async function mostrarNumerosComprados(phone) {
  if (!phone) {
    boughtNumbersDiv.textContent = '';
    return;
  }
  const snapshot = await db.collection('numerosRifa')
    .where("userId", "==", phone)
    .get();
  const numeros = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    numeros.push(data.numero);
  });
  boughtNumbersDiv.textContent = numeros.length
      ? "Você já comprou os números: " + numeros.join(", ")
      : "Você ainda não comprou nenhum número.";
}

// Função para validar telefone no formato (XX) 9XXXX-XXXX
function validarTelefone(phone) {
  const regex = /^\(\d{2}\) 9\d{4}-\d{4}$/;
  return regex.test(phone);
}

// Função para formatar telefone (aceita qualquer formato e transforma em (XX) 9XXXX-XXXX)
function formatarTelefone(rawPhone) {
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 11) return rawPhone; // não formata se menos que 11 dígitos
  const ddd = digits.slice(0, 2);
  const number = digits.slice(2, 11);
  return `(${ddd}) ${number[0]}${number.slice(1,5)}-${number.slice(5,9)}`;
}

// Formata o telefone ao sair do campo e mostra números comprados
form.phone.addEventListener('blur', async () => {
  form.phone.value = formatarTelefone(form.phone.value);
  const phone = form.phone.value.trim();
  if (phone) await mostrarNumerosComprados(phone);
});

// No submit do formulário, valida telefone formatado
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = form.name.value.trim();
  let phone = form.phone.value.trim();
  const participate = form.participate.value;
  const paymentMethod = paymentMethodSelect.value;
  const numerosArray = Array.from(numerosSelecionados);

  // Formata telefone antes de validar e enviar
  phone = formatarTelefone(phone);
  form.phone.value = phone; // atualiza o campo com o formato correto

  if(!name || !phone || !participate || !paymentMethod || numerosArray.length === 0) {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Preencha todos os campos e selecione pelo menos um número.';
    return;
  }

  if (!validarTelefone(phone)) {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Telefone inválido. Use o formato (XX) 9XXXX-XXXX.';
    form.phone.focus();
    return;
  }

  if(paymentMethod === 'Pix') {
    const pixProof = document.getElementById('pixProof').files[0];
    if(!pixProof) {
      messageDiv.style.color = 'red';
      messageDiv.textContent = 'Anexe o comprovante do Pix.';
      return;
    }
  }

  try {
    // Verificar se algum número já está reservado
    for(const num of numerosArray) {
      const numeroDoc = await db.collection('numerosRifa').doc(num.toString()).get();
      if(numeroDoc.exists) {
        messageDiv.style.color = 'red';
        messageDiv.textContent = `O número ${num} já está reservado. Escolha outro.`;
        await carregarNumerosDisponiveis();
        return;
      }
    }

    // Upload do comprovante Pix, se aplicável
    let pixProofUrl = '';
    if(paymentMethod === 'Pix') {
      const file = document.getElementById('pixProof').files[0];
      const storageRef = storage.ref();
      const fileRef = storageRef.child(`comprovantes/${Date.now()}_${file.name}`);
      await fileRef.put(file);
      pixProofUrl = await fileRef.getDownloadURL();
    }

    // Salvar números no Firestore
    const batch = db.batch();
    numerosArray.forEach(num => {
      const numeroRef = db.collection('numerosRifa').doc(num.toString());
      batch.set(numeroRef, {
        numero: num,
        status: paymentMethod === 'Dinheiro' ? 'pendente' : 'confirmado',
        userId: phone,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();

    // Salvar dados no rifaSales
    const promises = numerosArray.map(num => {
      return db.collection('rifaSales').add({
        name,
        phone,
        participate,
        paymentMethod,
        valor: VALOR_NUMERO,
        pixKey: paymentMethod === 'Pix' ? PIX_CHAVE : '',
        numero: num,
        comprovanteUrl: pixProofUrl || '',
        status: paymentMethod === 'Dinheiro' ? 'Pendente' : 'Comprovante enviado',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    await Promise.all(promises);

    messageDiv.style.color = 'green';
    messageDiv.textContent = 'Números reservados com sucesso!';
    form.reset();
    numerosSelecionados.clear();
    numerosSelecionadosInput.value = '';
    totalCompraDiv.textContent = '';
    pixPaymentLinkDiv.innerHTML = '';
    pixUploadDiv.style.display = 'none';
    await carregarNumerosDisponiveis();
    await mostrarNumerosComprados(phone);

  } catch (error) {
    console.error(error);
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Erro ao enviar. Tente novamente.';
  }
});

// Quando sair do input telefone, formata e atualiza números comprados
form.phone.addEventListener('blur', async () => {
  form.phone.value = formatarTelefone(form.phone.value);
  const phone = form.phone.value.trim();
  if (phone) await mostrarNumerosComprados(phone);
});

// Inicializar números disponíveis ao carregar página
carregarNumerosDisponiveis();

// Copiar chave Pix ao clicar no botão
document.getElementById('copyPixBtn').addEventListener('click', () => {
  const pixKey = document.getElementById('pixKey').textContent.trim();
  if (navigator.clipboard && window.isSecureContext) {
    // Usando Clipboard API
    navigator.clipboard.writeText(pixKey).then(() => {
      alert('Chave Pix copiada para a área de transferência!');
    }, () => {
      alert('Falha ao copiar a chave Pix.');
    });
  } else {
    // Fallback antigo
    const textArea = document.createElement("textarea");
    textArea.value = pixKey;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert('Chave Pix copiada para a área de transferência!');
    } catch (err) {
      alert('Falha ao copiar a chave Pix.');
    }
    document.body.removeChild(textArea);
  }
});
