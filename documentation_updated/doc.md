# 📦 MCP Storage Server: User & Developer Documentation

## 🧩 Overview

The **MCP Storage Server** is a decentralized storage backend designed to work with the [Storacha](https://github.com/seetadev/storacha) protocol. This guide will help you initialize, configure, and run the server locally using a DID identity created via the `w3` CLI.

---

## ✅ Prerequisites

Make sure you have the following installed:

- Node.js (>= 18.x)
- pnpm (`npm install -g pnpm`)
- Storacha CLI (`@web3-storage/w3up-client`)
- Git
- Terminal access to the `w3` CLI
- A `.env` file (to be created as shown below)

---

## 🛠️ Step-by-Step Setup Instructions

### 1. Clone the Repository

    git clone https://github.com/seetadev/mcp-storage-server.git
    cd mcp-storage-server

### 2. Install Dependencies

    pnpm install

### 3. Generate a DID with `w3` CLI

    w3 key create

You will receive output like:  
 did:key:z6Mksy5DyqogbDe72f4ZMJaSehyEfWExsgw87sLXjYvcJXDs  
 MgCY88hNkBaEOKF9dvX44XGsK4NQ6XPr2ZcO274UQoHWG7O0ByMsefpRQtj...  
📌 **Save the DID and Private Key.** You’ll need these in the `.env` file.

### 4. (Optional) Create Delegation

    w3 delegation create <agent_id> \
      --can 'store/add' \
      --can 'store/list' \
      --can 'store/remove' \
      --audience <space_key_did> \
      --out ./delegation.car

Replace `<agent_id>` with your DID and `<space_key_did>` with the recipient DID. This creates `delegation.car`.

### 5. Set Up `.env` File

Create a file named `.env` in the project root with these contents:  
 PORT=3000  
 HOST=localhost

    # Your service identity
    SERVER_IDENTITY_DID=did:key:z6Mksy5DyqogbDe72...
    SERVER_IDENTITY_PRIVATE_KEY=MgCY88hNkBaEOKF9...

    # Optional (if you created a delegation)
    DELEGATION_CAR_PATH=./delegation.car

### 6. Run the Server

    pnpm dev

Visit: http://localhost:3000

---

## 🧪 Testing the Server

Integrate with clients such as:

- tg-miniapp
- Any Storacha-compatible application

In your client’s `.env`:  
 NEXT_PUBLIC_STORACHA_SERVICE_URL=http://localhost:3000

---

## 🔐 Security Notes

- **Do not** commit `.env` or private keys to version control.
- Store your private keys securely.
- For production:
- Enable HTTPS
- Use a secure key vault

---

## 🚧 Troubleshooting

| Issue                  | Solution                                                         |
| ---------------------- | ---------------------------------------------------------------- |
| Missing or invalid DID | Check `.env` for typos in `SERVER_IDENTITY_DID` or `PRIVATE_KEY` |
| Port already in use    | Change `PORT` in `.env` (e.g., to `3001`)                        |
| tg-miniapp crashes     | Ensure MCP server is running and client `.env` points correctly  |

---

## 📬 Support

For issues, open a GitHub issue in the [repo](https://github.com/seetadev/mcp-storage-server/issues) or ask in the C4GT Discord.
