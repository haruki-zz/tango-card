export const getNetworkStateAsync = jest.fn(async () => ({
  type: "wifi",
  isConnected: true,
  isInternetReachable: true,
}));

export default {
  getNetworkStateAsync,
};
