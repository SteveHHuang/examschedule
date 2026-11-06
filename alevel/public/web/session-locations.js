// Excel uses separate lines for the holding room and the examination room.
export function getSessionLocations(session) {
  const location = String(session.location ?? '').trim();
  const lines = location.split(/\r\n?|\n/).map(line => line.trim()).filter(Boolean);
  if (session.supervisionTime && lines.length > 1) {
    return {
      supervisionLocation: lines[0],
      examLocation: lines.slice(1).join('\n'),
    };
  }
  // A single room only specifies the examination room, never the holding room.
  return { supervisionLocation: '', examLocation: location };
}
