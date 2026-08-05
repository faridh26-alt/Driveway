import React, { useState } from 'react';

export default function BookingWidget({ backendUrl = 'http://localhost:4242' }) {
  const TIERS = [
    { id: 'small', label: 'Small', nzd: 59.99 },
    { id: 'mid', label: 'Mid', nzd: 100 },
    { id: 'big', label: 'Big', nzd: 250 }
  ];

  const [tier, setTier] = useState('small');
  const [customAmount, setCustomAmount] = useState('');
  const [datetime, setDatetime] = useState(''); // format: yyyy-MM-ddTHH:mm (datetime-local)
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('0224042681');
  const [email, setEmail] = useState('farid.h26@ojc.school.nz');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [status, setStatus] = useState(null);

  function getAmountCents() {
    if (customAmount && Number(customAmount) > 0) {
      return Math.round(Number(customAmount) * 100);
    }
    const t = TIERS.find(x => x.id === tier);
    return Math.round((t?.nzd || 0) * 100);
  }

  async function submitBooking(e) {
    e.preventDefault();
    if (!datetime || !address) {
      setStatus('Please choose date/time and enter an address.');
      return;
    }
    setStatus('Creating booking...');
    try {
      const payload = {
        tier,
        amountCents: getAmountCents(),
        datetime: new Date(datetime).toISOString(), // send ISO datetime
        address,
        customerName: name,
        phone,
        email,
        notes,
        payment_method: paymentMethod,
        currency: 'nzd'
      };
      const res = await fetch(`${backendUrl}/create-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        if (paymentMethod === 'card' && data.checkoutUrl) {
          // redirect to Stripe Checkout
          window.location = data.checkoutUrl;
        } else {
          setStatus(`Booking confirmed (id ${data.booking.id}). ${data.message || ''} Owner contact: ${data.ownerContact?.phone || ''} ${data.ownerContact?.email || ''}`);
        }
      } else {
        setStatus('Error: ' + (data.error || 'Could not create booking'));
      }
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  }

  return (
    <form className="card" onSubmit={submitBooking}>
      <h3>Book an appointment</h3>

      <div>
        <strong>Tier</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {TIERS.map(t => (
            <button type="button" key={t.id} onClick={() => { setTier(t.id); setCustomAmount(''); }}
              style={{ padding: 8, borderRadius: 6, background: tier === t.id ? '#0366d6' : '#f3f4f6', color: tier === t.id ? '#fff' : '#111' }}>
              {t.label} — NZD {t.nzd}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Or custom amount (NZD): <input type="number" step="0.5" value={customAmount} onChange={e=>setCustomAmount(e.target.value)} /></label>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Date & time:
          <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
      </div>

      <div style={{ marginTop: 8 }}>
        <label>Address:
          <input value={address} onChange={e=>setAddress(e.target.value)} style={{ marginLeft: 8, width: '60%' }} placeholder="Street, City, Postcode" />
        </label>
      </div>

      <div style={{ marginTop: 8 }}>
        <label>Name: <input value={name} onChange={e=>setName(e.target.value)} style={{ marginLeft: 8 }} /></label>
      </div>
      <div style={{ marginTop: 8 }}>
        <label>Phone: <input value={phone} onChange={e=>setPhone(e.target.value)} style={{ marginLeft: 8 }} /></label>
      </div>
      <div style={{ marginTop: 8 }}>
        <label>Email: <input value={email} onChange={e=>setEmail(e.target.value)} style={{ marginLeft: 8 }} /></label>
      </div>
      <div style={{ marginTop: 8 }}>
        <label>Notes: <input value={notes} onChange={e=>setNotes(e.target.value)} style={{ marginLeft: 8, width: '60%' }} /></label>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Payment</strong>
        <div style={{ marginTop: 8 }}>
          <label><input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} /> Card</label>
          <label style={{ marginLeft: 16 }}><input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} /> Cash on service</label>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button type="submit">{paymentMethod === 'card' ? 'Pay & Book' : 'Book (Pay cash on arrival)'}</button>
      </div>

      {status && <div style={{ marginTop: 12 }}>{status}</div>}
      <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
        Owner contact: 0224042681 · farid.h26@ojc.school.nz
      </div>
    </form>
  );
}