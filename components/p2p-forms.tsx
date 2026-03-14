"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@banking/ui";
import { formatCurrency } from "@banking/utils";

type ContactOption = {
  id: string;
  displayName: string;
  handle: string;
};

type AccountOption = {
  id: string;
  nickname: string;
  availableBalance: number;
};

export function P2PContactForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [contactForm, setContactForm] = useState({
    displayName: "",
    handle: "",
    destinationReference: ""
  });
  const [localError, setLocalError] = useState<string | null>(null);

  async function submitContact() {
    setLocalError(null);

    const response = await fetch("/api/p2p", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(contactForm)
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setLocalError(payload.error ?? "Unable to add the P2P contact.");
      return;
    }

    startTransition(() => {
      router.replace("/p2p?message=Peer%20contact%20added");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <input
        className="h-11 rounded-2xl border border-slate-200 px-4"
        onChange={(event) =>
          setContactForm((current) => ({
            ...current,
            displayName: event.target.value
          }))
        }
        placeholder="Contact name"
        required
        type="text"
        value={contactForm.displayName}
      />
      <input
        className="h-11 rounded-2xl border border-slate-200 px-4"
        onChange={(event) =>
          setContactForm((current) => ({
            ...current,
            handle: event.target.value
          }))
        }
        placeholder="@handle"
        required
        type="text"
        value={contactForm.handle}
      />
      <input
        className="h-11 rounded-2xl border border-slate-200 px-4"
        onChange={(event) =>
          setContactForm((current) => ({
            ...current,
            destinationReference: event.target.value
          }))
        }
        placeholder="Email or payment handle"
        required
        type="text"
        value={contactForm.destinationReference}
      />
      {localError ? <p className="text-sm text-rose-600">{localError}</p> : null}
      <Button
        aria-busy={isPending}
        disabled={
          isPending ||
          !contactForm.displayName ||
          !contactForm.handle ||
          !contactForm.destinationReference
        }
        onClick={() => void submitContact()}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : null}
          {isPending ? "Saving contact..." : "Save contact"}
        </span>
      </Button>
    </div>
  );
}

export function P2PPaymentForm({
  contacts,
  checkingAccounts,
  blockingMessage
}: {
  contacts: ContactOption[];
  checkingAccounts: AccountOption[];
  blockingMessage?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paymentForm, setPaymentForm] = useState({
    contactId: contacts[0]?.id ?? "",
    fromAccountId: checkingAccounts[0]?.id ?? "",
    direction: "sent",
    amount: "",
    note: ""
  });
  const [localError, setLocalError] = useState<string | null>(null);

  async function submitPayment() {
    setLocalError(null);

    const response = await fetch("/api/p2p", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...paymentForm,
        amount: Number(paymentForm.amount)
      })
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setLocalError(payload.error ?? "Unable to create the peer payment.");
      return;
    }

    startTransition(() => {
      router.replace("/p2p?message=Peer%20payment%20submitted");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <select
        className="h-11 rounded-2xl border border-slate-200 px-4"
        onChange={(event) =>
          setPaymentForm((current) => ({
            ...current,
            contactId: event.target.value
          }))
        }
        value={paymentForm.contactId}
      >
        {contacts.map((contact) => (
          <option key={contact.id} value={contact.id}>
            {contact.displayName} ({contact.handle})
          </option>
        ))}
      </select>
      <select
        className="h-11 rounded-2xl border border-slate-200 px-4"
        onChange={(event) =>
          setPaymentForm((current) => ({
            ...current,
            fromAccountId: event.target.value
          }))
        }
        value={paymentForm.fromAccountId}
      >
        {checkingAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.nickname} | {formatCurrency(account.availableBalance)}
          </option>
        ))}
      </select>
      <select
        className="h-11 rounded-2xl border border-slate-200 px-4"
        onChange={(event) =>
          setPaymentForm((current) => ({
            ...current,
            direction: event.target.value
          }))
        }
        value={paymentForm.direction}
      >
        <option value="sent">Send money</option>
        <option value="requested">Request money</option>
      </select>
      <input
        className="h-11 rounded-2xl border border-slate-200 px-4"
        min="0.01"
        onChange={(event) =>
          setPaymentForm((current) => ({
            ...current,
            amount: event.target.value
          }))
        }
        placeholder="Amount"
        step="0.01"
        type="number"
        value={paymentForm.amount}
      />
      <input
        className="h-11 rounded-2xl border border-slate-200 px-4"
        onChange={(event) =>
          setPaymentForm((current) => ({
            ...current,
            note: event.target.value
          }))
        }
        placeholder="Note"
        type="text"
        value={paymentForm.note}
      />
      {blockingMessage ? (
        <p className="text-sm text-amber-700">{blockingMessage}</p>
      ) : null}
      {localError ? <p className="text-sm text-rose-600">{localError}</p> : null}
      <Button
        aria-busy={isPending}
        disabled={
          isPending ||
          !paymentForm.contactId ||
          !paymentForm.fromAccountId ||
          !paymentForm.amount
        }
        onClick={() => void submitPayment()}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : null}
          {isPending ? "Submitting..." : "Submit peer payment"}
        </span>
      </Button>
    </div>
  );
}
