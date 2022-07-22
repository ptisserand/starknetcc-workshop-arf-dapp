import React from "react";
import { toFelt } from "starknet/utils/number";

import { useStarknet } from "../StarknetProvider";

import { BlockHashContext } from "./context";
import { BLOCK_STATE_INITIAL_STATE, BlockState } from "./model";

interface BlockHashProviderProps {
  children: React.ReactNode;
  interval?: number;
}

export function BlockHashProvider({
  interval,
  children,
}: BlockHashProviderProps): JSX.Element {
  // Get current provider
  const { provider } = useStarknet();

  // Init the reducer with initial data
  // TODO: use setBlock to update the local state
  const [block, setBlock] = React.useState<BlockState>(
    BLOCK_STATE_INITIAL_STATE
  );

  // Called each time the provider change
  const fetchBlockHash = React.useCallback(async () => {
    const ret = await provider.getBlock();
    setBlock({blockHash: ret.block_hash, blockNumber: ret.block_number, gasPrice: ret.gas_price});
  }, [provider]);

  React.useEffect(() => {
    fetchBlockHash();
    // Fetch the block infos at each interval (here 5sec)
    const intervalId = setInterval(() => {
      fetchBlockHash();
    }, interval ?? 5000);
    return () => clearInterval(intervalId);
  }, [interval, fetchBlockHash]);

  return (
    <BlockHashContext.Provider value={block}>
      {children}
    </BlockHashContext.Provider>
  );
}
