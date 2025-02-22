const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config();

// Konfigurasi RPC dan Wallet
const RPC_URL = "http://rpc.nexus.xyz/http";  // Pastikan menggunakan HTTP
const provider = new ethers.JsonRpcProvider(RPC_URL);
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);

// Default Chain ID jika tidak bisa didapat dari provider
const DEFAULT_CHAIN_ID = 392;

// Default amount
const DEFAULT_AMOUNT = "0.01";

async function getChainID() {
    try {
        const network = await provider.getNetwork();
        console.log(`🌐 Connected to chain ID: ${network.chainId}`);
        return network.chainId || DEFAULT_CHAIN_ID;
    } catch (error) {
        console.error("❌ Failed to fetch Chain ID, using default:", DEFAULT_CHAIN_ID);
        return DEFAULT_CHAIN_ID;
    }
}

async function sendNEX(to, amount = DEFAULT_AMOUNT) {
    try {
        console.log("\n==============================");
        console.log("      🚀 Sending NEX 🚀      ");
        console.log("==============================\n");

        const chainId = await getChainID();

        // Ambil saldo sebelum transaksi
        let balanceBefore = await provider.getBalance(wallet.address);
        console.log(`💰 Balance before: ${ethers.formatUnits(balanceBefore, 18)} NEX`);

        // Konversi jumlah ke format ether
        const value = ethers.parseUnits(amount.toString(), 18);

        // Buat transaksi dengan Chain ID
        const tx = await wallet.sendTransaction({
            to,
            value,
            chainId
        });

        console.log(`🔹 Transaction sent! Hash: ${tx.hash}`);

        // Simpan transaksi ke file
        fs.appendFileSync("transactions.txt", `To: ${to}, Amount: ${amount}, TX Hash: ${tx.hash}\n`);

        // Tunggu konfirmasi
        await tx.wait();
        console.log("✅ Transaction confirmed!");

        // Ambil saldo setelah transaksi
        let balanceAfter = await provider.getBalance(wallet.address);
        console.log(`💰 Balance after: ${ethers.formatUnits(balanceAfter, 18)} NEX`);
    } catch (error) {
        console.error("❌ Transaction failed:", error);
    }
}

// Baca alamat dari file dan gunakan jumlah default
const inputFile = "send_list.txt";
(async () => {
    if (fs.existsSync(inputFile)) {
        const data = fs.readFileSync(inputFile, "utf8").split("\n");
        for (const line of data) {
            if (line.trim()) {
                const recipient = line.trim();
                await sendNEX(recipient);
            }
        }
    } else {
        console.error("❌ File send_list.txt tidak ditemukan.");
    }
})();
