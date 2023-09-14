export default function base64Helper(string) {
  return Buffer.from(string).toString("base64");
}
