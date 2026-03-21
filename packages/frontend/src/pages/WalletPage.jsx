import { useState, useEffect } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import DashboardNavbar from "../components/Dashboard/DashboardNavbar.jsx";
import Sidebar from "../components/Dashboard/SideBar.jsx";

const TX_CONFIG = {
  transfer: { icon: "↗️", label: "Transfer Sent",   color: "text-red-500"   },
  reward:   { icon: "🎁", label: "Reward Received", color: "text-green-600" },
  credit:   { icon: "⬆️", label: "Credit",          color: "text-green-600" },
  debit:    { icon: "⬇️", label: "Debit",           color: "text-red-500"   },
};

const isCredit = (tx, userId) =>
  tx.transactionType === "reward" ||
  (tx.transactionType === "transfer" &&
    tx.toUser?._id?.toString() === userId?.toString());

const TransactionRow = ({ tx, userId }) => {
  const credit = isCredit(tx, userId);
  const config = TX_CONFIG[tx.transactionType] || TX_CONFIG.credit;
  const date   = new Date(tx.createdAt);
  const peer   = credit ? tx.fromUser : tx.toUser;

  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-[var(--border)] last:border-0">
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-lg flex-shrink-0">
        {config.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{config.label}</p>
        <p className="text-xs text-[var(--text-muted)] truncate">
          {credit ? "From" : "To"}: {peer?.fullName || peer?.username || "SkillSync"}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          {" · "}
          {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Amount */}
      <span className={`text-sm font-bold flex-shrink-0 ${credit ? "text-green-500" : "text-red-500"}`}>
        {credit ? "+" : "-"}{tx.amount} tkn
      </span>
    </div>
  );
};

const WalletPage = () => {
  const [user, setUser]                           = useState(null);
  const [wallet, setWallet]                       = useState(null);
  const [transactions, setTransactions]           = useState([]);
  const [users, setUsers]                         = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [txLoading, setTxLoading]                 = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [txFilter, setTxFilter]                   = useState("all");
  const [transferData, setTransferData]           = useState({ toUserId: "", amount: "" });

  const fetchWallet = async () => {
    const walletRes = await API.get("/wallet");
    setWallet(walletRes.data.data);
  };

  const fetchTransactions = async () => {
    try {
      const txRes = await API.get("/wallet/transactions");
      setTransactions(txRes.data.data || []);
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          API.get("/auth/current-user"),
          API.get("/wallet"),
          API.get("/users"),
          API.get("/wallet/transactions"),
        ]).then(([userRes, walletRes, usersRes]) => {
          setUser(userRes.data.data);
          setWallet(walletRes.data.data);
          setUsers(usersRes.data.data || []);
        });
        fetchTransactions();
      } catch {
        toast.error("Failed to load wallet");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTransfer = async () => {
    if (!transferData.toUserId || !transferData.amount) {
      toast.error("Please fill all fields");
      return;
    }
    if (Number(transferData.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (Number(transferData.amount) > wallet.balance) {
      toast.error("Insufficient balance");
      return;
    }
    try {
      await API.post("/wallet/transfer", {
        toUserId: transferData.toUserId,
        amount:   Number(transferData.amount),
      });
      await fetchWallet();
      await fetchTransactions();
      setShowTransferModal(false);
      setTransferData({ toUserId: "", amount: "" });
      toast.success("Tokens transferred!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Transfer failed");
    }
  };

  const filteredTx = transactions.filter((tx) => {
    if (txFilter === "all")      return true;
    if (txFilter === "received") return isCredit(tx, user?._id);
    if (txFilter === "sent")     return !isCredit(tx, user?._id);
    return true;
  });

  const totalReceived = transactions
    .filter((tx) => isCredit(tx, user?._id))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalSent = transactions
    .filter((tx) => !isCredit(tx, user?._id))
    .reduce((sum, tx) => sum + tx.amount, 0);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-muted)]">Loading...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <DashboardNavbar user={user} />
      <Sidebar />

      <main className="pt-16 pl-60 min-h-screen">
        <div className="p-8">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Header */}
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Wallet</h1>

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl p-8 shadow-lg">
              <p className="text-indigo-200 text-sm font-medium mb-1">Total Balance</p>
              <p className="text-5xl font-extrabold mb-1">{wallet?.balance || 0}</p>
              <p className="text-indigo-200">SkillSync Tokens</p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="bg-white text-indigo-600 px-5 py-2 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
                >
                  ↗️ Send Tokens
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[var(--bg-card)] rounded-xl p-4 shadow-sm text-center border border-[var(--border)]">
                <p className="text-2xl font-bold text-indigo-500">{wallet?.balance || 0}</p>
                <p className="text-sm text-[var(--text-muted)]">Current Balance</p>
              </div>
              <div className="bg-[var(--bg-card)] rounded-xl p-4 shadow-sm text-center border border-[var(--border)]">
                <p className="text-2xl font-bold text-green-500">+{totalReceived}</p>
                <p className="text-sm text-[var(--text-muted)]">Total Received</p>
              </div>
              <div className="bg-[var(--bg-card)] rounded-xl p-4 shadow-sm text-center border border-[var(--border)]">
                <p className="text-2xl font-bold text-red-500">-{totalSent}</p>
                <p className="text-sm text-[var(--text-muted)]">Total Sent</p>
              </div>
            </div>

            {/* How Tokens Work */}
            <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">How Tokens Work</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-500/10 rounded-xl">
                  <p className="text-2xl mb-2">🎓</p>
                  <p className="font-semibold text-green-500">Earn</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Teach a skill to earn tokens</p>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-xl">
                  <p className="text-2xl mb-2">📚</p>
                  <p className="font-semibold text-blue-500">Spend</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Learn a skill using tokens</p>
                </div>
                <div className="text-center p-4 bg-purple-500/10 rounded-xl">
                  <p className="text-2xl mb-2">🔄</p>
                  <p className="font-semibold text-purple-500">Transfer</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Send tokens to other users</p>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Transaction History</h2>
                <span className="text-xs text-[var(--text-muted)]">{transactions.length} transactions</span>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 px-6 pt-4">
                {["all", "received", "sent"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTxFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                      txFilter === f
                        ? "bg-indigo-600 text-white"
                        : "bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--border)]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="px-6 pb-2">
                {txLoading ? (
                  <div className="space-y-3 py-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 rounded-xl bg-[var(--bg-secondary)] animate-pulse" />
                    ))}
                  </div>
                ) : filteredTx.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-3xl mb-2">💸</p>
                    <p className="text-[var(--text-muted)] text-sm">No transactions yet.</p>
                    <p className="text-[var(--text-muted)] text-xs mt-1 opacity-60">
                      Transfer tokens or complete sessions to see history.
                    </p>
                  </div>
                ) : (
                  <div>
                    {filteredTx.map((tx) => (
                      <TransactionRow key={tx._id} tx={tx} userId={user?._id} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Details */}
            <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Wallet Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                  <span className="text-[var(--text-muted)] text-sm">Wallet ID</span>
                  <span className="text-[var(--text-secondary)] font-mono text-xs">{wallet?._id}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                  <span className="text-[var(--text-muted)] text-sm">Owner</span>
                  <span className="text-[var(--text-primary)] font-semibold text-sm">{user?.fullName}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-[var(--text-muted)] text-sm">Current Balance</span>
                  <span className="text-indigo-500 font-bold text-xl">{wallet?.balance} tokens</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Send Tokens</h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Your balance:{" "}
              <span className="font-bold text-indigo-500">{wallet?.balance} tokens</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Send To</label>
                <select
                  value={transferData.toUserId}
                  onChange={(e) => setTransferData({ ...transferData, toUserId: e.target.value })}
                  className="w-full mt-1 p-3 border border-[var(--border)] rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select user...</option>
                  {users.filter((u) => u._id !== user?._id).map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.fullName} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Amount</label>
                <input
                  type="number"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  placeholder="Enter amount..."
                  min="1"
                  max={wallet?.balance}
                  className="w-full mt-1 p-3 border border-[var(--border)] rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 py-3 border border-[var(--border)] rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;