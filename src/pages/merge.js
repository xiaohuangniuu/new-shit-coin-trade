import {
  NumberInput,NumberInputField,NumberInputStepper,NumberIncrementStepper,NumberDecrementStepper, Input, Button,
  chakra, useToast, useMediaQuery, Container,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import _ from "lodash"


function MergePage(){
  const [addressList,setAddressList] = useState([])
  const [bnbProvider,setBNBProvider] = useState(null)
  const [rpcUrl,setRpcUrl] = useState("")
  const [mnemonic,setMnemonic] = useState("")
  const [isLoading,setIsLoading] = useState(false)
  const [receiveAddress,setReceiveAddress] = useState("")

  useEffect( ()=>{
    if (rpcUrl){
      const provider = ethers.getDefaultProvider(rpcUrl)
      setBNBProvider(provider)
    }
  },[rpcUrl])

  const getAccounts = ()=>{
    (async ()=>{

      const tmpAddressList = []
      setIsLoading(true)
      for (let i = 0;i<10;i++) {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic,"m/44'/60'/0'/0/"+i);
        console.log(wallet.privateKey)
        const address = await wallet.getAddress()


        const result = await bnbProvider.getBalance(address)
        const gas = ((await bnbProvider.getGasPrice()))

        console.log(ethers.utils.formatEther(BigNumber.from(result).minus(gas)))
        const balanceInBNB = ethers.utils.formatEther(result)
        tmpAddressList.push({wallet:wallet,address:address,balance:balanceInBNB,index:i})
      }
      setIsLoading(false)
      setAddressList(tmpAddressList)
    })()
  }

  const toast = useToast()
  const merge =() => {
    (async ()=>{
      if (addressList.length === 0) {
        toast({
          title: '请先扫描子账号',
          description: "",
          status: 'warning',
          duration: 3000,
          position:"top-right",
          isClosable: true,
        })
        return
      }

      for(let i = 0;i<addressList.length;i++) {
        const wallet = addressList[i]
        const account = wallet.wallet.connect(bnbProvider)
        const tx = await account.sendTransaction({
          to:receiveAddress,
          value:ethers.utils.parseEther(wallet.balance),
          gasLimit: ethers.utils.hexlify(10000),
          gasPrice: ethers.utils.hexlify(parseInt(await bnbProvider.getGasPrice())),
        })
        console.log(tx)
      }

      // const tx = signer.sendTransaction({
      //   to: "ricmoo.firefly.eth",
      //   value: ethers.utils.parseEther("1.0")
      // });

    })()
  }

  return (
    <Container>
      <chakra.div borderRadius={"0.325rem"} p={2} mt={5}>
        <chakra.div>
          线上节点: https://bsc-dataseed1.binance.org

          <br/>
          测试节点: https://data-seed-prebsc-2-s2.binance.org:8545<br/>
          测试 WBNBAddress = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" <br/>
          测试 routerAddress = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3" <br/>
          合约: https://testnet.bscscan.com/token/0xa6c8b55c8fc30b9448367f18c59f87cccb4a8de3
        </chakra.div>
        <Input mt={2} mb={2}
               onChange={(event)=>{setRpcUrl(event.target.value)}}
               focusBorderColor='pink.400'
               placeholder='请输入RPC节点'
               size='sm'
        />
        <Input
          onChange={(event)=>{setMnemonic(event.target.value)}}
          focusBorderColor='pink.400'
          placeholder='请输入助记词'
          size='sm'
        />

        <Input
          onChange={(event)=>{setReceiveAddress(event.target.value)}}
          focusBorderColor='pink.400'
          placeholder='收款账户'
          size='sm'
        />

        <Button mt={2}  isLoading={isLoading} colorScheme={'blue'} onClick={getAccounts}>扫描子账号</Button>
        <Button mt={2}  colorScheme={'blue'} onClick={merge}>一键归集资金</Button>


        <chakra.div mt={2} borderRadius={"0.325rem"} maxH={"300px"} overflow={'auto'} bg={'purple.200'} p={2}>
          子账号:<br/>
          {addressList? addressList.map((v,k)=>{
            console.log(v)
            return <chakra.div>
              账户地址:{v.address},余额:{v.balance}
            </chakra.div>
          }):""}
        </chakra.div>
      </chakra.div>

    </Container>

  )
}

export default MergePage;