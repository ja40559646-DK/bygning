export function createConsoleMailer() {
  return {
    send({ to, subject, text }) {
      console.log(`[MAIL] to=${to} subject=${subject} text=${text}`);
    }
  };
}

export function createInMemoryMailer() {
  const sent = [];

  return {
    send(payload) {
      sent.push(payload);
    },

    getSent() {
      return [...sent];
    }
  };
}
