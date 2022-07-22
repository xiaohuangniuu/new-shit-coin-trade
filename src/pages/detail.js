import {
  Heading, Container, GridItem,
  chakra, Grid, useMediaQuery, useNumberInput, Button, useToast, Input, IconButton, Divider,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import KECCAK256 from 'keccak256';
import { MerkleTree } from 'merkletreejs';
import Web3EthContract from 'web3-eth-contract';
import Web3 from 'web3';
import { GrFormAdd,GrFormSubtract } from "react-icons/gr";

function DetailPage(){
  const [abi,setAbi] = useState(null)
  const [tokenAbi,setTokenAbi] = useState(null)
  const [whiteList,setWhiteList] = useState([])
  // 钱包地址
  const [walletAddress,setWalletAddress] = useState("")
  // 合约实例化
  const [contractObj,setContractObj] = useState(null)
  const [tokenContractObj,setTokenContractObj] = useState(null)
  // web3实例化
  const [web3,setWeb3] = useState(null)
  const toast = useToast()

  const [isMobile] = useMediaQuery("(max-width: 768px)")

  // init 配置
  useEffect(() => {
    (async ()=>{
      const abiResponse = await fetch("/abi.json", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const abi = await abiResponse.json();
      setAbi(abi)

      const tokenAbiResponse = await fetch("/tokenAbi.json", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const tokenAbi = await tokenAbiResponse.json();
      setTokenAbi(tokenAbi)

      const whitelistResponse = await fetch("/whitelist.json", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const whiteList = await whitelistResponse.json();
      console.log(whiteList)
      setWhiteList(whiteList)

      const leaves = whiteList.map(x => KECCAK256(x));
      const tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true })
      let rootHash = tree.getRoot().toString("hex")
      setGTree(tree)
      setRootHash(rootHash)


      const { ethereum } = window;
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{
            chainId: Web3.utils.numberToHex(4) // 目标链ID
          }]
        })
      }catch (e){
        toast({
          title: 'Please add the ETH network node first.',
          description: "",
          status: 'warning',
          duration: 3000,
          position:"top-right",
          isClosable: true,
        })
        return
      }
      Web3EthContract.setProvider(ethereum);
      let web3 = new Web3(ethereum);
      setWeb3(web3)
      const SmartContractObj = new Web3EthContract(
        abi,
        "0x67cFFAd0115011417ea5c750fc492771af16DB96"
      );
      setContractObj(SmartContractObj)


      const tokenContractObj = new Web3EthContract(
        tokenAbi,
        "0x0D7AEF268D09910F22a9e5E284B897c833CD6f0B"
      );
      setTokenContractObj(tokenContractObj)

    })()
  },[])

  let [claimInfo,setClaimInfo] = useState(null)
  useEffect(() => {
    if (!contractObj  || !web3) {
      return
    }
    //读取config
    (async ()=> {
      const result = await contractObj.methods.claimInfos(0).call({from:walletAddress})
      console.log(result)
      let info = {

        claimMaxBNB:result.claimMaxBNB,
        claimMaxToken:result.claimMaxToken,
        exchangeRate:result.exchangeRate,
        harvestTimes:result.harvestTimes,
        initPercentage:result.initPercentage,
        publicSaleTime:result.publicSaleTime,
        token:result.token,
        totalAmount:result.totalAmount,
        decimals:result.decimals,
      }

      setClaimInfo(info)

    })()
  },[contractObj,web3])

  let [harvestInfo,setHarvestInfo] = useState(null)
  useEffect(()=>{
    if (!walletAddress || !contractObj  || !web3) {
      return
    }
    //读取收获配置
    (async ()=> {
      const result = await contractObj.methods.harvested(0,walletAddress).call({from:walletAddress})
      let info ={
        lastClaimedTime:result.lastClaimedTime,
        receiveTimes:result.receiveTimes,
        remainingAmount:result.remainingAmount,
        token:result.token,
      }
      setHarvestInfo(info)
    })()
  },[walletAddress,contractObj,web3])

  let [claimedAmount,setclaimedAmount] = useState(-1)
  useEffect(()=>{
    if (!walletAddress || !contractObj  || !web3) {
      return
    }
    (async ()=> {
      const result = await contractObj.methods.claimed(0,walletAddress).call({from:walletAddress})
      setclaimedAmount(result)
    })()

  },[walletAddress,contractObj,web3])

  useEffect(()=>{
      if (claimInfo && claimedAmount >=0 ) {
        let result = Math.floor((claimInfo.claimMaxToken-claimedAmount)/claimInfo.exchangeRate*100)/100
        setMaxClaimBNB(result)
      }
  },[claimedAmount,claimInfo])

  const buf2hex = x => '0x' + x.toString('hex')
  const [rootHash,setRootHash] = useState("")
  const [gtree,setGTree] = useState(null)

  const [isWhitelist,setIsWhitelist] = useState(false)
  useEffect(()=>{
    if (!walletAddress || !contractObj  || !web3) {
      return
    }
    let rootHash = gtree.getRoot().toString('hex')
    console.log(rootHash)
    let leaf = buf2hex(KECCAK256(walletAddress));
    let proof = gtree.getProof(leaf).map(x => buf2hex(x.data));
    let verifyResult = gtree.verify(proof, leaf, rootHash)
    setIsWhitelist(verifyResult)
  },[walletAddress,contractObj,web3])

  const connectWallet = async ()=>{
    if (abi) {
      const { ethereum } = window;
      const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
      if (!metamaskIsInstalled){
        toast({
          title: 'MetaMask is not installed.',
          description: "Please install MetaMask first.",
          status: 'warning',
          position:"top-right",
          duration: 3000,
          isClosable: true,
        })
        return
      }
    }else {
      toast({
        title: 'Abi file being loaded.',
        description: "Abi file being loaded.",
        status: 'warning',
        duration: 3000,
        position:"top-right",
        isClosable: true,
      })
      return
    }

    const { ethereum } = window;
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{
          chainId: Web3.utils.numberToHex(4) // 目标链ID
        }]
      })
    }catch (e){
      toast({
        title: 'Please add the ETH network node first.',
        description: "",
        status: 'warning',
        duration: 3000,
        position:"top-right",
        isClosable: true,
      })
      return
    }

    const networkId = await ethereum.request({
      method: "net_version",
    });

    if (networkId == 4) {
      await ethereum.request({
        method: "eth_requestAccounts",
      });
      const accounts = await web3.eth.getAccounts()
      setWalletAddress(accounts[0])
      // Add listeners start
      ethereum.on("accountsChanged", (accounts) => {
        setWalletAddress(accounts[0])
      });

    }else {
      toast({
        title: 'Wrong network node.',
        description: "",
        status: 'warning',
        duration: 3000,
        position:"top-right",
        isClosable: true,
      })
      return
    }
  }

  const [maxClaimBNB,setMaxClaimBNB] = useState(0)
  const { getInputProps, getIncrementButtonProps, getDecrementButtonProps } =
    useNumberInput({
      step: 0.01,
      defaultValue: 0.00,
      min: 0,
      max: maxClaimBNB,
      precision:2,
    })
  const input = getInputProps()
  const inc = getIncrementButtonProps()
  const dec = getDecrementButtonProps()
  const [isClaimLoading,setIsClaimLoading] = useState(false)
  const [isHarvestLoading,setIsHarvestLoading] = useState(false)
  const harvest = async ()=>{
    console.log(contractObj,walletAddress,web3)
    if (contractObj && walletAddress && web3) {
      setIsHarvestLoading(true)
      try{
        const result = await contractObj.methods.harvest(0).send({ from: walletAddress, value: 0, gas: 3000000 })
        setIsHarvestLoading(false)
      }catch (e) {
        setIsHarvestLoading(false)
      }
      setIsHarvestLoading(false)
      setIsRefresh(true)
    }
  }
  const [isRefresh,setIsRefresh] = useState(false)
  useEffect(() => {
    if (isRefresh) {
      if (!walletAddress || !contractObj  || !web3) {
        return
      }
      (async ()=> {
        let claimedResult = await contractObj.methods.claimed(0,walletAddress).call({from:walletAddress})
        setclaimedAmount(claimedResult)

        let balanceOfResult = await tokenContractObj.methods.balanceOf(walletAddress).call({from:walletAddress})
        setBalanceOf(balanceOfResult)

        const result = await contractObj.methods.harvested(0,walletAddress).call({from:walletAddress})
        let info ={
          lastClaimedTime:result.lastClaimedTime,
          receiveTimes:result.receiveTimes,
          remainingAmount:result.remainingAmount,
          token:result.token,
        }
        setHarvestInfo(info)
      })()
      setIsRefresh(false)
    }
  },[isRefresh])
  const doClaim = async () => {
    if (contractObj && walletAddress && web3) {
      let inputBNB = parseFloat(input.value);
      if (inputBNB < 0.01) {
        toast({
          title: 'BNB number not legal.',
          description: "",
          status: 'warning',
          duration: 3000,
          position:"top-right",
          isClosable: true,
        })
        return
      }

      if (inputBNB > maxClaimBNB) {
        toast({
          title: 'Claim BNB overcount.',
          description: "",
          status: 'warning',
          duration: 3000,
          position:"top-right",
          isClosable: true,
        })
        return
      }

      let price = web3.utils.toWei(input.value, 'ether');
      console.log(price)
      let leaf = buf2hex(KECCAK256(walletAddress));
      let proof = gtree.getProof(leaf).map(x => buf2hex(x.data));
      console.log(proof)
      setIsClaimLoading(true)
      try{
        await contractObj.methods.claim(walletAddress, 0,proof).send({ from: walletAddress, value: price, gas: 3000000 })
      }catch (e) {
        setIsClaimLoading(false)
      }
      setIsClaimLoading(false)
      setIsRefresh(true)

      // const mintNum = await contractObj.methods.getNumMinted(walletAddress).call({from:walletAddress})
      // setMintAllowanceNum(3-mintNum)
    }
  }
  const [balanceOf,setBalanceOf] = useState(null)
  useEffect(()=>{
    if (!walletAddress || !tokenContractObj  || !web3) {
      return
    }
    (async()=>{
      const result = await tokenContractObj.methods.balanceOf(walletAddress).call({from:walletAddress})

      setBalanceOf(result)
    })()

  },[walletAddress,tokenContractObj,web3])

  const [isHarvest,setIsHarvest] = useState(true)
  const [isClaim,setIsClaim] = useState(true)
  useEffect(()=>{
    if (harvestInfo) {
      if (harvestInfo.lastClaimedTime == 0){
        setIsHarvest(false)
      }
      if (Math.floor(new Date().getTime() / 1000) - claimInfo.lastClaimedTime >= 86400) {
        setIsHarvest(false)
      }
    }
    if (claimInfo && isWhitelist == false && Math.floor(new Date().getTime() / 1000) < claimInfo.publicSaleTime) {
      setIsClaim(true)
    }else {
      setIsClaim(false)
    }


  },[harvestInfo,claimInfo])
  console.log("isHarvest",isHarvest)
  function timeConverter(UNIX_timestamp){
    if (UNIX_timestamp == 0) {
      return 0
    }
    let a = new Date(UNIX_timestamp * 1000);
    //let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let year = a.getFullYear();
    //let month = months[a.getMonth()];
    let month = a.getMonth()+1;
    let date = a.getDate();
    let hour = a.getHours();
    let min = a.getMinutes();
    let sec = a.getSeconds();
    //let time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    let time = year + '.'+month +"." +date+"  " + hour + ':' + min + ':' + sec ;

    return time;
  }
  return(
    <Container maxW='4xl'>
      <chakra.div  h="4.5rem" display={'flex'}  alignItems="center">
        {walletAddress?
          <chakra.div>
            <chakra.div fontWeight={"500"} fontStyle={"italic"}>
              WalletAddress:{walletAddress} <chakra.span fontWeight={"bold"} fontSize={"12px"} color={"gray.500"}>{isWhitelist?"Whitelist":"No Whitelist"}</chakra.span>
            </chakra.div>
            <chakra.div>
              Hold Token:{claimInfo && balanceOf ? balanceOf/(10**claimInfo.decimals):0}
            </chakra.div>
          </chakra.div>
          :
          // _focus={{ boxShadow: "none",textDecoration:"none",border:'none' }}
          // _hover={{  bg:"blue.100",boxShadow: "none",textDecoration:"none",border:'none',color: "purple.500" }}
          // color="gray.500"
          <Button  colorScheme='blue' onClick={connectWallet}>Connect Metamask</Button>}

      </chakra.div>


      <chakra.div mt={3} display={'flex'} justifyContent={'center'} flexDirection={'column'}>
        <Heading as='h4' size='md' textAlign={'center'}>Doge king</Heading>
        <chakra.div mt={1} fontStyle={'italic'} fontWeight={'500'} textAlign={'center'}>
          Public Sale
        </chakra.div>
        <chakra.div mt={2} mb={2} fontStyle={'italic'} fontSize={"md"} fontWeight={"400"}>
          Featured: Hide transactions involving tokens flagged as having poor reputation with
          Featured: Hide transactions involving tokens flagged as having poor reputation with
          Featured: Hide transactions involving tokens flagged as having poor reputation with
        </chakra.div>
      </chakra.div>

      <Divider mt={2} mb={2}/>
      <chakra.div fontStyle={'italic'} fontSize={"xl"}>
        Project Config
      </chakra.div>
      <Grid mt={3} templateColumns='repeat(3, 1fr)' gap={6}>
        <chakra.div h={"100px"}   _hover={{  bg:"blue.200",boxShadow: "none",textDecoration:"none",border:'none' }}
                    display={'flex'} flexDirection={'column'} alignContent={'center'}  borderRadius={"0.5rem"} bg={"blue.300"}  opacity={"0.8"} as={GridItem}>
          <chakra.span m={3} h={"20%"} fontSize={"2xl"} fontWeight={"bold"} color={"blue.600"}>Total Supply</chakra.span>
          <chakra.span h={"80%"} fontSize={"2xl"} m={3} fontWeight={'bold'} color={'black'}>{claimInfo?claimInfo.totalAmount/(10**claimInfo.decimals):"Loading..."}</chakra.span>
        </chakra.div>

        <chakra.div h={"100px"}  _hover={{  bg:"blue.200",boxShadow: "none",textDecoration:"none",border:'none' }}
                    display={'flex'} flexDirection={'column'} alignContent={'center'}  borderRadius={"0.5rem"} bg={"blue.300"}  opacity={"0.8"} as={GridItem}>
          <chakra.span m={3} h={"20%"} fontSize={"2xl"} fontWeight={"bold"} color={"blue.600"}>Exchange(1BNB)</chakra.span>
          <chakra.span h={"80%"} fontSize={"2xl"} m={3} fontWeight={'bold'} color={'black'}>{claimInfo?claimInfo.exchangeRate/(10**claimInfo.decimals):"Loading..."}</chakra.span>
        </chakra.div>
        <chakra.div h={"100px"}  _hover={{  bg:"blue.200",boxShadow: "none",textDecoration:"none",border:'none' }}
                    display={'flex'} flexDirection={'column'} alignContent={'center'}  borderRadius={"0.5rem"} bg={"blue.300"}  opacity={"0.8"} as={GridItem}>
          <chakra.span m={3} h={"20%"} fontSize={"2xl"} fontWeight={"bold"} color={"blue.600"}>Claim Max Token</chakra.span>
          <chakra.span h={"80%"} fontSize={"2xl"} m={3} fontWeight={'bold'} color={'black'}>{claimInfo?claimInfo.claimMaxToken/(10**claimInfo.decimals):"Loading..."}</chakra.span>
        </chakra.div>
      </Grid>

      <Grid mt={3} templateColumns='repeat(3, 1fr)' gap={6}>
        <chakra.div h={"100px"}  _hover={{  bg:"blue.200",boxShadow: "none",textDecoration:"none",border:'none' }}
                    display={'flex'} flexDirection={'column'} alignContent={'center'}  borderRadius={"0.5rem"} bg={"blue.300"}  opacity={"0.8"} as={GridItem}>
          <chakra.span m={3} h={"20%"} fontSize={"2xl"} fontWeight={"bold"} color={"blue.600"}>Initial Release</chakra.span>
          <chakra.span h={"80%"} fontSize={"2xl"} m={3} fontWeight={'bold'} color={'black'}>{claimInfo?claimInfo.initPercentage+"%":"Loading..."}</chakra.span>
        </chakra.div>
        <chakra.div h={"100px"}  _hover={{  bg:"blue.200",boxShadow: "none",textDecoration:"none",border:'none' }}
                    display={'flex'} flexDirection={'column'} alignContent={'center'}  borderRadius={"0.5rem"} bg={"blue.300"}  opacity={"0.8"} as={GridItem}>
          <chakra.span m={3} h={"20%"} fontSize={"2xl"} fontWeight={"bold"} color={"blue.600"}>HarvestTimes </chakra.span>
          <chakra.span h={"80%"} fontSize={"2xl"} m={3} fontWeight={'bold'} color={'black'}>{claimInfo?claimInfo.harvestTimes:"Loading..."}</chakra.span>
        </chakra.div>
        <chakra.div h={"100px"}  _hover={{  bg:"blue.200",boxShadow: "none",textDecoration:"none",border:'none' }}
                    display={'flex'} flexDirection={'column'} alignContent={'center'}  borderRadius={"0.5rem"} bg={"blue.300"}  opacity={"0.8"} as={GridItem}>
          <chakra.span m={3} h={"20%"} fontSize={"2xl"} fontWeight={"bold"} color={"blue.600"}>Sales Status</chakra.span>
          <chakra.span h={"80%"} fontSize={"2xl"} m={3} fontWeight={'bold'} color={'black'}>{claimInfo?
            Math.floor(new Date().getTime() / 1000) > claimInfo.publicSaleTime ? "Public Sale":"Whitelist Sale":"Loading..."}
          </chakra.span>
        </chakra.div>

      </Grid>

      {walletAddress ?
        <chakra.div>
        <chakra.div mt={2} fontStyle={'italic'} fontSize={"xl"}>
          Harvest Information
        </chakra.div>
        <Grid mt={3} templateColumns='repeat(3, 1fr)' gap={6}>
          <chakra.div h={"100px"}  _hover={{  bg:"blue.200",boxShadow: "none",textDecoration:"none",border:'none' }}
                      display={'flex'} flexDirection={'column'} alignContent={'center'}  borderRadius={"0.5rem"} bg={"blue.300"}  opacity={"0.8"} as={GridItem}>
            <chakra.span m={3} h={"20%"} fontSize={"2xl"} fontWeight={"bold"} color={"blue.600"}>Remaining Amount </chakra.span>
            <chakra.span h={"80%"} fontSize={"2xl"} m={3} fontWeight={'bold'} color={'black'}>{harvestInfo?harvestInfo.remainingAmount/(10**claimInfo.decimals):"Loading..."}</chakra.span>
          </chakra.div>

        <chakra.div h={"100px"}  _hover={{  bg:"blue.200",boxShadow: "none",textDecoration:"none",border:'none' }}
        display={'flex'} flexDirection={'column'} alignContent={'center'}  borderRadius={"0.5rem"} bg={"blue.300"}  opacity={"0.8"} as={GridItem}>
        <chakra.span m={3} h={"20%"} fontSize={"2xl"} fontWeight={"bold"} color={"blue.600"}>Harvest times</chakra.span>
        <chakra.span h={"80%"} fontSize={"2xl"} m={3} fontWeight={'bold'} color={'black'}>{harvestInfo?harvestInfo.receiveTimes:"Loading..."}</chakra.span>
        </chakra.div>

        <chakra.div h={"100px"}  _hover={{  bg:"blue.200",boxShadow: "none",textDecoration:"none",border:'none' }}
        display={'flex'} flexDirection={'column'} alignContent={'center'}  borderRadius={"0.5rem"} bg={"blue.300"}  opacity={"0.8"} as={GridItem}>
          <chakra.span m={3} h={"20%"} fontSize={"2xl"} fontWeight={"bold"} color={"blue.600"}>Next harvest time </chakra.span>
          <chakra.span h={"80%"} fontSize={"2xl"} m={3} fontWeight={'bold'} color={'black'}>{harvestInfo?timeConverter(harvestInfo.lastClaimedTime):"Loading..."}</chakra.span>
        </chakra.div>
        </Grid>
        </chakra.div>:""}


      <Grid mt={3} templateColumns='repeat(2, 1fr)' gap={6}>
        <chakra.div  as={GridItem} display={'flex'} flexDirection={'column'}>
          <chakra.div mb={3} h={"40px"}  display={'flex'} flexDirection={'row'}>
            <IconButton  _hover={{bg:"gray.400"}} {...dec} _focus={{ boxShadow: "none",textDecoration:"none",border:'none' }} bg={""}
                         aria-label='twitter' icon={<GrFormSubtract size={35} />} />
            <Input  fontWeight={"bold"} border={"1px solid black"}
                    _hover={{ boxShadow: "none",textDecoration:"none",border:"1px solid black" }}
                    _focus={{ boxShadow: "none",textDecoration:"none",border:"1px solid black" }}
                    bg={""} textAlign={'center'} {...input} />
            <IconButton _hover={{bg:"gray.400"}} {...inc} _focus={{ boxShadow: "none",textDecoration:"none",border:'none' }} bg={""}
                        aria-label='twitter' icon={<GrFormAdd size={35} />} />
          </chakra.div>
          <Button colorScheme='blue' onClick={doClaim}
                  isLoading={isClaimLoading}
                  disabled={isClaim || isClaimLoading}>
            Claim {input.value} BNB</Button>
        </chakra.div>

        <chakra.div as={GridItem} display={'flex'} flexDirection={'column'}>
          <chakra.div mb={3} alignItems={'center'} h={"40px"} fontWeight={"bold"} fontSize={'xl'} display={'flex'} flexDirection={'row'}>
            Harvestable Token:
            <chakra.span fontWeight={"400"}> {claimInfo && harvestInfo ? harvestInfo.remainingAmount/(7-harvestInfo.receiveTimes)/(10**claimInfo.decimals):"0"}</chakra.span>

          </chakra.div>
          <Button colorScheme='blue' isLoading={isHarvestLoading} disabled={isHarvest || isHarvestLoading} onClick={harvest}>Harvest</Button>
        </chakra.div>
      </Grid>



    </Container>
  )
}

export default DetailPage