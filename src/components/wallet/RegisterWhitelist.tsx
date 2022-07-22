import {
  Box,
  Button,
  Code,
  Flex,
  Link,
  Spinner,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { AddTransactionResponse, CallContractResponse, defaultProvider } from "starknet";
import { toFelt } from "starknet/utils/number";

import { useContract } from "../../context/ContractProvider";
import { useBlock, useStarknet, useTransactions } from "context";

// Whitelist register component
const RegisterWhitelist = () => {
  // Get account & connection status from Starknet Manager
  const { connected, account } = useStarknet();
  const { colorMode } = useColorMode();
  // Get access controller contract
  const { accessControllerContract } = useContract();
  const { addTransaction } = useTransactions();
  // Get the current block hash from Block Manager
  const { blockHash } = useBlock();

  // Init the local state of the component
  // True if whitelisted, false else
  const [isWhitelisted, setWhitelisted] = useState(false);
  // Free slots available on the contract
  const [freeSlots, setFreeSlots] = useState(-1);
  // Is the transaction loading
  const [isLoading, setLoading] = useState(false);

  // Check if an address is currently whitelisted by the contract & update the state as well
  const checkWhitelisted = async (accountAddress: string) => {
    setLoading(true);
    const ret = await accessControllerContract.isAllowed(accountAddress);
    if (1 === ret[0].toNumber()) {
      setWhitelisted(true);
    }
    setLoading(false);
  };

  // Fetch the current free slots available on the access controller & update the state as well
  const getFreeSlotsCount = useCallback(async () => {
    setLoading(true);
    const ret = await accessControllerContract.freeSlotsCount();
    setFreeSlots(ret[0].toNumber());
    setLoading(false);
  }, [accessControllerContract]);

  // Fetch free slots on every block
  useEffect(() => {
    getFreeSlotsCount();
  }, [blockHash, getFreeSlotsCount]);

  // Register to the whitelist with the current connected address
  const registerToWhitelist = async () => {
    setLoading(true);
    try {
      const { transaction_hash: tx_hash } = await accessControllerContract.register();
      addTransaction({transaction_hash: tx_hash, address: account?.address});
    } catch(error) {
      console.error(error);
    }
    setLoading(false);
  };

  // UI part, you don't need to touch it (but you can if you want to improve :D)
  return (
    <Box>
      <Text as="h2" marginTop={4} fontSize="2xl">
        Register for whitelist
      </Text>
      <Flex direction="column">
        <Text>Access controller Contract:</Text>
        <Code mt={4} w="fit-content">
          <Link
            isExternal
            textDecoration="none !important"
            outline="none !important"
            boxShadow="none !important"
            href={`https://voyager.online/contract/${accessControllerContract.address}`}
          >
            {accessControllerContract.address}
          </Link>
        </Code>
        <Text mt={4}>Free slots: {freeSlots > -1 ? freeSlots : "-"}</Text>
        {/* If user is whitelisted show congrats, else display button to register */}
        <Box mt={4}>
          {isWhitelisted ? (
            <Box fontSize="md">Congrats! You are whitelisted</Box>
          ) : (
            <Box fontSize="md">You are currently not whitelisted</Box>
          )}
          {isLoading && <Spinner />}
          {connected && account && (
            <Flex direction="row" my={4}>
              <Button
                mr={4}
                w="fit-content"
                onClick={() => {
                  // When user click on check whitelist
                  checkWhitelisted(account.address);
                }}
              >
                Check whitelisted
              </Button>
              <Button
                disabled={isWhitelisted}
                w="fit-content"
                onClick={() => {
                  // When user click on register to whitelist
                  registerToWhitelist();
                }}
              >
                Register to whitelist
              </Button>
            </Flex>
          )}
        </Box>
        {!connected && (
          <Box
            backgroundColor={colorMode === "light" ? "gray.200" : "gray.500"}
            padding={4}
            marginTop={4}
            borderRadius={4}
          >
            <Box fontSize="md">
              Connect your wallet to see your registration or register to
              whitelist.
            </Box>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default RegisterWhitelist;
