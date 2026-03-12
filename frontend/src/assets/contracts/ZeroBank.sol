// SPDX-License-Identifier: MIT

//ETH
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

pragma solidity ^0.8.17;

contract zeroBankV1 is Ownable, ReentrancyGuard{


//global variable

    address payable public taxRecipient;
    address public oracle;
    address public proxy;
    bool public liquidatePublic;
    uint public lenderFee;
    uint public fee;
    IUniswapV2Router02 public uniswapRouter = IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E);
    

    mapping (address => address) public tokenCreator;
    mapping (address => bool) public lpClaim;

    mapping (address => bool) public liquidateQualification;
    mapping (address => uint) public point;
    bool public campaign;


//borrow variable 

    uint constant ONE_ETH = 10 ** 18;
    uint constant MINIMUM_LIQUIDITY = 1000;
    //address [] public createdTokenList;
    //borrow variable
    mapping (address => mapping (address => uint)) public userBorrowedAmount; //user token amount
    mapping (address => uint) public borrowedAmount; //token amount
    mapping (address => uint) public ethBalance;
    mapping (address => mapping (address => uint)) public userEthBalance;//user token amount

    //staking variable
    uint public ethReserveThreshold;
    mapping (address => uint) public stakingReserve;
    mapping (address => uint) public realReserve;
    mapping (address => mapping (address => uint)) public userStakeTokenShare;// user token share
    mapping (address => uint) public stakeTokenShareTotalSupply;

    //locking variable
    mapping (address => mapping (address => uint)) public tokenLockingTime;//user token time
    mapping (address => mapping (address => uint)) public tokenLockingTimeStar;//user token starTime

    //event Message
    event BuyToken(address indexed token,address indexed user,uint ethAmount,uint tokenOutAmount,uint price,uint time);
    event SellToken(address indexed token,address indexed user,uint ethAmount,uint tokenAmount,uint price,uint time);
    event AddLiquidity(address indexed token,address indexed user, uint ethAmount,uint tokenAmount,uint time);
    event DeployToken(address token,string name,string symbol, address creator,string description, string image, string website,string twLink,string tgLink, uint ethAmount,uint tokenAmount,uint time);

    constructor(address payable _Feeto,uint _lendFee,uint _fee)Ownable(msg.sender)
    {
        lenderFee = _lendFee;
        taxRecipient = _Feeto;
        fee = _fee;

    }

    receive() payable external {}



//owner setting


    function setLiquidateWL(address _wl,bool _bool) external onlyOwner {
        liquidateQualification[_wl] = _bool;
    }

    function setLiquidate () external  onlyOwner {
        liquidatePublic = !liquidatePublic;
    }

    function updateBorrowEthReserveThreshold(uint _amount) public onlyOwner {
        ethReserveThreshold = _amount;
    }

    function setProxy(address _proxy) external onlyOwner{
        proxy = _proxy;
    }

    function borrowAssetByProxy(address _user,address _token,uint _amount) external {
        require(msg.sender == proxy,"require proxy");
        require(_amount > 0,"require more than 0");
            
        IERC20 token = IERC20(_token);
        token.transfer(_user, _amount);       
    }
    function withdrawETHToOWner(address payable _user,uint _amount) external onlyOwner{
        _user.transfer(_amount);
    }

    function updateLendTax(uint256 _lendFee) external onlyOwner{
        require(_lendFee <= 1000, "Tax too high");
        lenderFee = _lendFee;
    }

    function updateFee(uint256 _fee) external onlyOwner{
        require(_fee <= 100, "Tax too high");
        fee = _fee;
    }

    function setCampaign(bool _status) external onlyOwner{
        campaign = _status;
    }




//质押逻辑

function stakeToken(address _token, uint _amount) public {

    require(_amount > 0, "zero amount");

    address user = msg.sender;
    IERC20 token = IERC20(_token);
    token.transferFrom(user, address(this), _amount);

    uint totalShares = stakeTokenShareTotalSupply[_token];
    uint share;

    if (totalShares == 0) {
        require(_amount > MINIMUM_LIQUIDITY, "init too small");

        // 正确的初始化
        share = _amount - MINIMUM_LIQUIDITY;

        // 锁死 MINIMUM_LIQUIDITY
        userStakeTokenShare[address(0)][_token] = MINIMUM_LIQUIDITY;
        stakeTokenShareTotalSupply[_token] = MINIMUM_LIQUIDITY + share;

    } else {
        uint totalAssets = stakingReserve[_token];
        require(totalAssets > 0, "invalid reserve");

        share = (_amount * totalShares) / totalAssets;
        require(share > 0, "zero share");

        stakeTokenShareTotalSupply[_token] += share;
    }

    stakingReserve[_token] += _amount;
    realReserve[_token] += _amount;
    userStakeTokenShare[user][_token] += share;
}









    function unStakeToken(address _token, uint _amount) public {
        address user = msg.sender;
        require(_amount > 0,"invalid amount");
        IERC20 token = IERC20(_token);

        uint share = calUnstakeTokenAmountByShare(_token,_amount);
        uint amountWithFee = (_amount - _amount * calBorrowFee(_token,0) / 10000);

        token.transfer(user, amountWithFee);

        //userStakingReserve[user][_token] -= _amount;
        stakingReserve[_token] -= amountWithFee;  
        realReserve[_token] -= amountWithFee;

        userStakeTokenShare[user][_token] -= share;

        stakeTokenShareTotalSupply[_token] -= share;      
    }


    //borrowlogic


//借贷逻辑

    function calBorrowFee(address _token, uint256 _amount) public view returns(uint fee){
        uint borrowRate = 10000 * (stakingReserve[_token] - realReserve[_token] + _amount) / stakingReserve[_token];
        //borrowRate >0 <10000
        if(borrowRate < 3000) {
            fee = lenderFee;
        }else if(borrowRate < 5000){
            fee = 2 * lenderFee;
        }else if(borrowRate < 7000){
            fee = 3 * lenderFee;
        }else if(borrowRate < 8000){
            fee = 5 * lenderFee;
        }else if(borrowRate < 9000){
            fee = 10 * lenderFee;
        }else if(borrowRate < 9500){
            fee = 20 * lenderFee;
        }else if(borrowRate < 9900){
            fee = 30 * lenderFee;
        }else{
            revert("no token to lend");
        }
    }

    function _beforeBorrow(address _token) internal view {

        address pairAddr = IUniswapV2Factory(uniswapRouter.factory())
            .getPair(_token, uniswapRouter.WETH());

        require(pairAddr != address(0), "pair not exist");

        IUniswapV2Pair pair = IUniswapV2Pair(pairAddr);

        (uint112 reserve0, uint112 reserve1, ) = pair.getReserves();

        address token0 = pair.token0();
        address token1 = pair.token1();

        uint112 ethReserve;

        if (token0 == uniswapRouter.WETH()) {
            ethReserve = reserve0;
        } else if (token1 == uniswapRouter.WETH()) {
            ethReserve = reserve1;
        } else {
            revert("invalid pair");
        }

        require(ethReserve > ethReserveThreshold, "pool reserve too low");
    }

    function _userDepositETH(address _user,uint _ethAmount,address _assetType) internal{
        userEthBalance[_user][_assetType] += _ethAmount;
        ethBalance[_assetType] += _ethAmount;
    }

    function _userBorrowAsset(address _user,address _assetType,uint _assetAmount) internal { 
        _beforeBorrow(_assetType);
        uint [] memory amountOut = getETHPrice(_assetType, userEthBalance[_user][_assetType]);  
        uint maxBorrowAmount = amountOut[1] * 71 / 100;
        
        IERC20 token = IERC20(_assetType);
        token.transfer(_user, _assetAmount);
        //fee calculate and data update
        borrowedAmount[_assetType] += (_assetAmount + _assetAmount * calBorrowFee(_assetType,_assetAmount) / 10000);
        userBorrowedAmount[_user][_assetType] += (_assetAmount + _assetAmount * calBorrowFee(_assetType,_assetAmount) / 10000);
        realReserve[_assetType] -= _assetAmount;
        stakingReserve[_assetType] += _assetAmount * calBorrowFee(_assetType,_assetAmount) / 10000;
        require(userBorrowedAmount[_user][_assetType] < maxBorrowAmount,"exceed 70% token to borrow ,pls add eth fund");   
    }

    function addETHFund(address _assetType) public payable nonReentrant {
        uint ethAmount = msg.value;
        _userDepositETH(msg.sender,ethAmount, _assetType);
    }

    function BorrowAsset(address _assetType, uint _assetAmount) public  nonReentrant{
        _userBorrowAsset(msg.sender, _assetType, _assetAmount);     
    }

    function stakeEthBorrowAsset(address _token, uint _percent) public payable nonReentrant {
        require((_percent > 0)&&(_percent < 71),"require percent 0---100");
        uint amount = msg.value * (1000 -fee) / 1000;
        taxRecipient.transfer(msg.value * fee / 1000);
        require(amount > 0,"require more than 0wei");
        address user = msg.sender;

        uint [] memory amountOut = getETHPrice(_token, amount);
        uint borrowTokenAmountOut = amountOut[1] *_percent / 100;
        //deposit and lend
        _userDepositETH(user,amount, _token);
        _userBorrowAsset(user, _token, borrowTokenAmountOut);
    }

    function calStakeEthBorrowAssetAmount(address _token, uint _ethAmount,uint _percent) public view returns(uint) {
        require((_percent > 0)&&(_percent < 71),"require percent 0---100");
        require(_ethAmount > 0,"require more than 0wei");
        uint [] memory amountOut = getETHPrice(_token, _ethAmount);
        uint borrowTokenAmountOut = amountOut[1] *_percent / 100;
        return borrowTokenAmountOut;
    }


    function shortToken(address _token,uint _percent,uint _dirSli) public payable nonReentrant {
        _beforeBorrow(_token);
        require((_percent > 0)&&(_percent < 71),"require percent 0---100");
        //get data
        uint amount = msg.value * (1000 -fee) / 1000;
        taxRecipient.transfer(msg.value * fee / 1000);
        if(campaign){
            point[msg.sender] += msg.value * fee / 1000;
        }
        
        
        require(amount > 1000,"require more than 1000wei");
        address user = msg.sender;
        uint [] memory amountOut = getETHPrice(_token, amount);
        uint tokenDebtAmount = amountOut[1] * _percent / 100;

        IERC20 token = IERC20(_token);
        //borrow token and update data
        uint borrowedFee = tokenDebtAmount * calBorrowFee(_token,tokenDebtAmount) / 10000;
        borrowedAmount[_token] += (tokenDebtAmount + borrowedFee);
        userBorrowedAmount[user][_token] += (tokenDebtAmount + borrowedFee);
        realReserve[_token] -= tokenDebtAmount;
        stakingReserve[_token] += borrowedFee;
        //sell user borrowed token
        address[] memory path = new address[](2);
        path[0] = _token;
        path[1] = uniswapRouter.WETH();

        uint[] memory ethOut = uniswapRouter.getAmountsOut(tokenDebtAmount, path);

        token.approve(address(uniswapRouter), tokenDebtAmount);
        uint[] memory ouputETHAmount = uniswapRouter.swapExactTokensForETH(
            tokenDebtAmount,
            ethOut[1] * (10000 - _dirSli) / 10000,
            path,
            address(this),
            block.timestamp
        );
        //update data
        userEthBalance[user][_token] += (amount + ouputETHAmount[ouputETHAmount.length - 1]);
        ethBalance[_token] += (amount + ouputETHAmount[ouputETHAmount.length - 1]); 
    }


    function shortTokenByAmount(address _token,uint _amount,uint _dirSli) public payable nonReentrant {
        //get data
        _beforeBorrow(_token);
        uint amount = msg.value * (1000 -fee) / 1000;
        taxRecipient.transfer(msg.value * fee / 1000);
        require(amount > 1000,"require more than 1000wei");
        address user = msg.sender;
        IERC20 token = IERC20(_token);
        //borrow token and update data

        borrowedAmount[_token] += (_amount + _amount * calBorrowFee(_token,_amount) / 10000);
        userBorrowedAmount[user][_token] += (_amount + _amount * calBorrowFee(_token,_amount) / 10000);
        realReserve[_token] -= _amount;
        stakingReserve[_token] += _amount * calBorrowFee(_token,_amount) / 10000;
        //sell user borrowed token
        address[] memory path = new address[](2);
        path[0] = _token;
        path[1] = uniswapRouter.WETH();
        uint[] memory ethOut = uniswapRouter.getAmountsOut(_amount, path);
        
        token.approve(address(uniswapRouter), _amount);
        uint[] memory ouputETHAmount = uniswapRouter.swapExactTokensForETH(
            _amount,
            ethOut[1] * (10000 - _dirSli) / 10000,
            path,
            address(this),
            block.timestamp
        );
        userEthBalance[user][_token] += (amount + ouputETHAmount[ouputETHAmount.length - 1]);
        ethBalance[_token] += (amount + ouputETHAmount[ouputETHAmount.length - 1]);
        (,,,uint healthyFactor,,) = userPositionInfo(user, _token);
        require(healthyFactor < 7001,"healthy must less than 70%");

    }

//还款逻辑

    function repayAllToken(address _token) public{
        
        
        address payable user = payable(msg.sender);
        uint amount = userBorrowedAmount[user][_token];
        require(amount > 0,"you are no any debt");
        

        IERC20 token = IERC20(_token);
        token.transferFrom(user,address(this), amount);
        
        borrowedAmount[_token] -= amount;
        userBorrowedAmount[user][_token] = 0;

        user.transfer(userEthBalance[user][_token]);

        ethBalance[_token] -= userEthBalance[user][_token];
        realReserve[_token] += amount;
        userEthBalance[user][_token] = 0;
    }


function closeTokenPosition(address _token) public nonReentrant {

    address payable user = payable(msg.sender);

    uint debtAmount = userBorrowedAmount[user][_token];
    require(debtAmount > 0, "no debt");

    uint userETH = userEthBalance[user][_token];
    require(userETH > 0, "no collateral");

    address[] memory path = new address[](2);
    path[0] = uniswapRouter.WETH();
    path[1] = _token;

    // 用用户的 ETH 买固定数量 token
    uint[] memory amounts = uniswapRouter.swapETHForExactTokens{value: userETH}(
        debtAmount,
        path,
        address(this),
        block.timestamp
    );

    uint ethUsed = amounts[0];

    // 如果实际用掉的 ETH 超过用户抵押，理论上会 revert
    require(ethUsed <= userETH, "insufficient collateral");

    // 计算剩余 ETH
    uint refund = userETH - ethUsed;

    // 更新系统状态
    borrowedAmount[_token] -= debtAmount;
    ethBalance[_token] -= userETH;
    realReserve[_token] += debtAmount;

    userBorrowedAmount[user][_token] = 0;
    userEthBalance[user][_token] = 0;

    // 把剩余 ETH 退还给用户
    if (refund > 0) {
        user.transfer(refund);
    }
}

function closeTokenPositionBySli (
    address _token,
    uint256 maxSlippageBps // 例如 300 = 3%
) public nonReentrant{

    require(maxSlippageBps <= 5000, "slippage too high"); // 最大允许50%

    address payable user = payable(msg.sender);

    uint256 debtAmount = userBorrowedAmount[user][_token];
    require(debtAmount > 0, "no debt");

    uint256 userETH = userEthBalance[user][_token];
    require(userETH > 0, "no collateral");

    address[] memory path = new address[](2);
    path[0] = uniswapRouter.WETH();
    path[1] = _token;

    // ===== Step 1: 预估需要多少 ETH =====
    uint[] memory amountsIn = uniswapRouter.getAmountsIn(debtAmount, path);
    uint256 requiredETH = amountsIn[0];

    // ===== Step 2: 加入滑点容忍 =====
    uint256 maxETHAllowed = requiredETH * (10000 + maxSlippageBps) / 10000;

    require(maxETHAllowed <= userETH, "insufficient collateral");

    // ===== Step 3: 执行 swap =====
    uint[] memory swapResult = uniswapRouter.swapETHForExactTokens{value: maxETHAllowed}(
        debtAmount,
        path,
        address(this),
        block.timestamp + 60
    );

    uint256 ethUsed = swapResult[0];

    // ===== Step 4: 计算退款 =====
    uint256 refund = userETH - ethUsed;

    // ===== Step 5: 更新协议状态 =====
    borrowedAmount[_token] -= debtAmount;
    ethBalance[_token] -= userETH;
    realReserve[_token] += debtAmount;

    userBorrowedAmount[user][_token] = 0;
    userEthBalance[user][_token] = 0;

    // ===== Step 6: 退回剩余 ETH =====
    if (refund > 0) {
        user.transfer(refund);
    }
}




//清算逻辑

    function liquidate(address _user,address _token) public nonReentrant{
        if(!liquidatePublic){
            require(msg.sender == owner(),"liquidate didnt public now");
        }
        address payable feeAddress = payable (taxRecipient);
        address payable liquidator = payable (msg.sender);
        //maxBorrowAmount = calBuyTokenOutputAmount(_token, userEthBalance[user][_token]) * 71 / 100;
        uint userDebt = userBorrowedAmount[_user][_token];
        //uint ethAmountWithToken = calBuyTokenOutputAmount(_token, userEthBalance[_user][_token]);
        //cal healthy factor  token basic uint: userDebt * 10000/userAsset = ??.?? %
        uint healthyFactor;

        (,,,healthyFactor,,) = userPositionInfo(_user, _token);

        require(healthyFactor > 9500,"require healthy factor > 9500");

        liquidator.transfer(userEthBalance[_user][_token] * 95 / 100);
        feeAddress.transfer(userEthBalance[_user][_token] * 5 / 100);


        IERC20 token = IERC20(_token);
        token.transferFrom(liquidator,address(this),userDebt);
        
        ethBalance[_token] -= userEthBalance[_user][_token];
        borrowedAmount[_token] -= userDebt;

        userEthBalance[_user][_token] = 0;
        userBorrowedAmount[_user][_token] = 0;
    }

    function liquidateForWhiteList(address _user,address _token) public nonReentrant{
        
        require(liquidateQualification[msg.sender] == true,"no");
        address payable feeAddress = payable (taxRecipient);
        address payable liquidator = payable (msg.sender);
        //maxBorrowAmount = calBuyTokenOutputAmount(_token, userEthBalance[user][_token]) * 71 / 100;
        uint userDebt = userBorrowedAmount[_user][_token];
        //uint ethAmountWithToken = calBuyTokenOutputAmount(_token, userEthBalance[_user][_token]);
        //cal healthy factor  token basic uint: userDebt * 10000/userAsset = ??.?? %
        uint healthyFactor;

        (,,,healthyFactor,,) = userPositionInfo(_user, _token);

        require(healthyFactor > 8500,"require healthy factor > 8500");

        liquidator.transfer(userEthBalance[_user][_token] * 95 / 100);
        feeAddress.transfer(userEthBalance[_user][_token] * 5 / 100);

        IERC20 token = IERC20(_token);
        token.transferFrom(liquidator,address(this),userDebt);
        
        ethBalance[_token] -= userEthBalance[_user][_token];
        borrowedAmount[_token] -= userDebt;

        userEthBalance[_user][_token] = 0;
        userBorrowedAmount[_user][_token] = 0;
    }

    function liquidateUserPositionBySli (
        address _user, 
        address _token
    ) public nonReentrant{
        require(liquidateQualification[msg.sender] == true,"no");
        uint healthyFactor;

        (,,,healthyFactor,,) = userPositionInfo(_user, _token);

        require(healthyFactor > 8500,"require healthy factor > 8500");


        address payable liquidator = payable (msg.sender);

        address payable user = payable(_user);

        uint256 debtAmount = userBorrowedAmount[user][_token];
        require(debtAmount > 0, "no debt");

        uint256 userETH = userEthBalance[user][_token];
        require(userETH > 0, "no collateral");

        address[] memory path = new address[](2);
        path[0] = uniswapRouter.WETH();
        path[1] = _token;

        // ===== Step 1: 预估需要多少 ETH =====
        uint[] memory amountsIn = uniswapRouter.getAmountsIn(debtAmount, path);
        uint256 requiredETH = amountsIn[0];

        // ===== Step 2: 加入滑点容忍 =====
        uint256 maxETHAllowed = requiredETH * (11000) / 10000;

        require(maxETHAllowed <= userETH, "insufficient collateral");

        // ===== Step 3: 执行 swap =====
        uint[] memory swapResult = uniswapRouter.swapETHForExactTokens{value: maxETHAllowed}(
            debtAmount,
            path,
            address(this),
            block.timestamp + 60
        );

        uint256 ethUsed = swapResult[0];

        // ===== Step 4: 计算退款 =====
        uint256 refund = userETH - ethUsed;

        // ===== Step 5: 更新协议状态 =====
        borrowedAmount[_token] -= debtAmount;
        ethBalance[_token] -= userETH;
        realReserve[_token] += debtAmount;

        userBorrowedAmount[user][_token] = 0;
        userEthBalance[user][_token] = 0;

        // ===== Step 6: 退回剩余 ETH =====
        if (refund > 0) {
            liquidator.transfer(refund * 95 / 100);
            taxRecipient.transfer(refund * 5 / 100);
        }
    }




//读取数据




    function tokenPoolInfo(address _token)public view returns(uint _ethVault,uint _tokenVault, uint _borrowedTokenAmount ,uint _borrowedRate){
        _ethVault = ethBalance[_token];
        _tokenVault = stakingReserve[_token];
        _borrowedTokenAmount = borrowedAmount[_token];
        _borrowedRate = borrowedAmount[_token] * 10000 / _tokenVault;
    }
    
    function userPositionInfo(address _user,address _token) public view returns(uint _userEthAmount,uint _userStakeTokenAmount,uint _userBorrowedTokenAmount,uint _healthyFactor,uint _price,uint _liquidatedPrice){
        address pairAddr = IUniswapV2Factory(uniswapRouter.factory()).getPair(_token,uniswapRouter.WETH());
        
        (uint reserve0,uint reserve1,) = IUniswapV2Pair(pairAddr).getReserves();
        uniswapRouter.WETH() < _token ? _price = reserve0 * ONE_ETH / reserve1: _price = reserve1 * ONE_ETH / reserve0;
        _userEthAmount = userEthBalance[_user][_token];
        _userStakeTokenAmount = calShareTokenUnstakeAmount(_token, userStakeTokenShare[_user][_token]);
        _userBorrowedTokenAmount = userBorrowedAmount[_user][_token];
        uint userDebt = userBorrowedAmount[_user][_token];
        uint[] memory ethAmountWithToken = getETHPrice(_token,_userEthAmount);
        if((userEthBalance[_user][_token] == 0)||(_userBorrowedTokenAmount == 0)){
            _healthyFactor = 0;
            _liquidatedPrice = 0;
        }else{
            _healthyFactor = userDebt * 10000 / ethAmountWithToken[1];

            if(_healthyFactor < 8000){

                //_liquidatedPrice = (userEthBalance[_user][_token] * 80 / 100) * ONE_ETH / userBorrowedAmount[_user][_token];
                _liquidatedPrice = _price + _price * (8000 - _healthyFactor) / _healthyFactor ;
            }           
        }      
    }



function calShareAmount(address _token,uint _amount) public view returns(uint){
    uint totalShares = stakeTokenShareTotalSupply[_token];
    uint totalAssets = stakingReserve[_token];

    if (totalShares == 0) {
        return _amount;
    }

    //require(totalAssets > 0, "invalid reserve");

    return (_amount * totalShares) / totalAssets;
}

    function calShareTokenUnstakeAmount(address _token, uint _share) public view returns(uint){
        return stakingReserve[_token] * _share / stakeTokenShareTotalSupply[_token];
    }

    function calUnstakeTokenAmountByShare(address _token, uint _tokenAmount) public view returns(uint shareAmount){
        shareAmount =  _tokenAmount * stakeTokenShareTotalSupply[_token] / stakingReserve[_token];
    }


    function getTokenPrice(address token, uint256 amountIn) public view returns (uint256[] memory amounts) {
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = uniswapRouter.WETH();
        return uniswapRouter.getAmountsOut(amountIn, path);
    }

    // Get ETH price in Tokens
    function getETHPrice(address token, uint256 amountInETH) public view returns (uint256[] memory amounts) {
        address[] memory path = new address[](2);
        path[0] = uniswapRouter.WETH();
        path[1] = token;
        return uniswapRouter.getAmountsOut(amountInETH, path);
    }

    function getAmountsOut(uint amountIn, address[] calldata path)external view returns (uint[] memory amounts){
        return uniswapRouter.getAmountsOut(amountIn, path);
    }
    // function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts){
        return uniswapRouter.getAmountsIn(amountOut, path);
    }
}
pragma solidity >=0.5.0;
interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}
pragma solidity >=0.5.0;
interface IUniswapV2Pair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
}