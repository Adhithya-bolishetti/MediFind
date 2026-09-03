import api from './api';

const videoService = {
  /**
   * Resolve the consultation room for an appointment. The backend re-checks
   * that the caller is a participant, that the appointment is an accepted
   * online consultation, and that the join window is open.
   */
  getRoom: async (appointmentId) => {
    const response = await api.get(`/video/appointments/${appointmentId}/room`);
    return response.data;
  },
};

/**
 * Build the signaling URL from the REST base URL, so a deployed frontend points
 * at the same host without any extra configuration.
 */
export const buildSignalingUrl = (signalingPath, roomId) => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const httpOrigin = new URL(apiBase, window.location.origin).origin;
  const wsOrigin = httpOrigin.replace(/^http/, 'ws');
  const token = localStorage.getItem('token') || '';
  return `${wsOrigin}${signalingPath}?roomId=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token)}`;
};

export default videoService;

/**
 * Join window around the scheduled time. Mirrors
 * `application.video.join-window-*-minutes` on the backend — this copy only
 * decides what the UI offers; the server is what actually enforces it.
 */
export const JOIN_WINDOW_BEFORE_MINUTES = 15;
export const JOIN_WINDOW_AFTER_MINUTES = 60;

export const isOnlineConsultation = (appointment) =>
  (appointment?.consultationType || '').toLowerCase() === 'online';

/**
 * Describes whether an appointment's video room can be entered right now.
 *
 * @returns {{show: boolean, joinable: boolean, hint: string}} `show` is false
 *   for anything that will never have a call (in-person, cancelled, declined).
 */
export const getCallAvailability = (appointment) => {
  const hidden = { show: false, joinable: false, hint: '' };
  if (!isOnlineConsultation(appointment)) return hidden;
  if (['CANCELLED', 'DECLINED', 'REJECTED', 'COMPLETED'].includes(appointment.status)) return hidden;

  if (appointment.status !== 'CONFIRMED') {
    return { show: true, joinable: false, hint: 'Opens once the doctor accepts' };
  }

  const scheduledAt = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
  if (Number.isNaN(scheduledAt.getTime())) return hidden;

  const now = Date.now();
  const opensAt = scheduledAt.getTime() - JOIN_WINDOW_BEFORE_MINUTES * 60_000;
  const closesAt = scheduledAt.getTime() + JOIN_WINDOW_AFTER_MINUTES * 60_000;

  if (now < opensAt) {
    return {
      show: true,
      joinable: false,
      hint: `Opens ${JOIN_WINDOW_BEFORE_MINUTES} min before, at ${new Date(opensAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };
  }
  if (now > closesAt) {
    return { show: true, joinable: false, hint: 'This consultation window has closed' };
  }
  return { show: true, joinable: true, hint: 'Join the video consultation' };
};
