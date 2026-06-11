import NetInfo from '@react-native-community/netinfo';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Wait until the device reports internet, or until timeout (ms). */
export async function waitForInternet(timeoutMs = 20_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const state = await NetInfo.fetch();
    if (state.isConnected !== true) {
      await sleep(400);
      continue;
    }

    // isInternetReachable is often null briefly on Android after Wi‑Fi/cellular connects.
    if (state.isInternetReachable === false) {
      await sleep(400);
      continue;
    }

    if (state.isConnected) {
      return true;
    }

    await sleep(400);
  }

  return false;
}
