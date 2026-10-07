import { useState } from 'react';
import api, { apiErrorMessage } from '../services/api';

// Shared swap-request modal logic, used by Discover, Dashboard and UserProfile.
// Keeps "which partner, which skills, is it sending" state in one place so the
// three pages don't each re-implement it.
//
// `myId` is the logged-in user's id. We fetch their fresh record (alongside
// the partner's) so the "skill you offer" dropdown always has populated
// skills, even if /auth/me returned them unpopulated.
export function useSwapRequest(myId) {
  const [match, setMatch] = useState(null); // the match card that was clicked
  const [partner, setPartner] = useState(null); // partner's full user record
  const [meFull, setMeFull] = useState(null); // my fresh user record
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const open = async (m) => {
    setMatch(m);
    setError('');
    setPartnerLoading(true);
    try {
      const [partnerRes, meRes] = await Promise.all([
        api.get(`/users/${m.user._id}`),
        myId ? api.get(`/users/${myId}`) : Promise.resolve(null),
      ]);
      setPartner(partnerRes.data);
      if (meRes) setMeFull(meRes.data);
    } catch {
      // If the fetch fails, fall back to whatever the card already had.
      setPartner(m.user);
    } finally {
      setPartnerLoading(false);
    }
  };

  const close = () => {
    setMatch(null);
    setPartner(null);
    setError('');
  };

  const submit = async ({ offeredSkill, requestedSkill, message }) => {
    setSubmitting(true);
    setError('');
    try {
      await api.post('/swaps', {
        receiver: match.user._id,
        offeredSkill,
        requestedSkill,
        ...(message ? { message } : {}),
      });
      close();
      return true;
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send the swap request.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isOpen: !!match,
    match,
    partner,
    meFull,
    partnerLoading,
    submitting,
    error,
    open,
    close,
    submit,
  };
}
