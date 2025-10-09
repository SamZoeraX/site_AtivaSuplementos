/* variavel:
é como uma caixa que serve para
armazenar informações. é um espaço no
programa/computador que armazena dados.
*/

//pode mudar o valor a qualquer momento
let nomevariavel = 1; //inteiro
let nomevariavel2 = "sammuel"; //varchar
let nomevariavel3 = 2.7 ; //double
let nomevariavel4 = true ; //boolean

//variável constante, que não altera o valor

const nome ="sammuel";

// operações matemáticas

let soma = 3+5; //8
let subtracao = 5-3; //2
let multiplicacao = 3*5; //15
let divisão = 10/2; //5

// juntar textos

let primeironome = "sammuel lee";
let sobrenome = "de Oliveira"
let nomecompleto = primeironome+sobrenome;

//funções

//função ela imrpime o Olá mundo
function imprimirMsg(){
    // console é utilizado para mostrar textos
    console.log("Hello World");
    console.log(primeironome+"Bem Vindo!");
}
// função com parâmetros
function somarValores(valor1,valor2){
    let soma = valor1+valor2;
    console.log("O Resultado da soma é:"+soma);
}

function subtrairValores(valor1,valor2){
    let sub = valor1-valor2;
    console.log("O resultado da subtração é:"+sub);
}

imprimirMsg();
somarValores(20,40);
subtrairValores(100,10);

function imc(altura,peso,nomepessoa){
    let resultado = (altura/peso) * altura;
    console.log(nomepessoa+"o seu IMC é"+resultado);

}
 imc(1.80,70,"Rhauan")

 // condicional
 /*
 É uma ação que é executada com base em um critério
 - Se chover, irei ao cinema. Se fizer sol, irei a praia.
 
 - Hoje choveu! (cinema)
 - Hoje fez sol! (ir à praia)

 Se fizer sol e eu estiver dinheiro, irei à praia,
 senão ficarei em casa.
 - Fez sol e tenho dinheiro (irei à praia)
 - Fez sol mas não tenho dinheiro (ficarei em casa)
 - Choveu mas tenho dinheiro (ficarei em casa)
 
 Se fizer sol ou eu estiver dinheiro, irei à praia,
 senão ficarei em casa.
 - Fez sol e tenho dinheiro (irei à praia)
 - Fez sol mas não tenho dinheiro (irei à praia)
 - Choveu mas tenho dinheiro (irei à praia)
 - Choveu e eu tô pobre (ficarei em casa) 
 */

 let n1 = 15;
 let n2 = 45;
// if - SE else - Senão

// se n1 for igaul a 10
if(n1=10){
    console.log("Irei à praia!");
}else{
    console.log("Fico em casa!");
}

// se o n1 for maior que 10
if(n1>10){
    console.log("Irei à praia!");
}else{
    console.log("Fico em casa!");
}

//se n1 for maior que 10 e n2 for menor que 40
if(n1>10 & n2<40){
    console.log("Irei à praia!");
}else{
    console.log("Fico em casa!");
}

// se n1 for maior que 10 OU n2 menor que 40
if(n1>10 || n2<40){
    console.log("Irei à praia!");
}else{
    console.log("Fico em casa!");
}

/* 
Se n1 for maior que 10 e n1 for maior que n2 e
 n2 for maior que 45
*/

if(n1>10 & n1>n2 & n2<40){
    console.log("Irei à praia!");
}else{
    console.log("Fico em casa!");
}

/*
1° condição - n1 menor que 10 E n2 maior que n1
                       OU
2° condição - n2 maior que 40 e n2 menor que 46                       
*/

if((n1>10 & n1>n2) || (n2>40 & n2<46)){
    console.log("Irei à praia!");
}else{
    console.log("Fico em casa!");
}

if(n1>12 && n2>48){
    console.log("Irei à praia!");
    // se n1 é maior ou igual a 15 E n2 menor que 45
}else if(n1>=15 && n2<45){
    console.log("Vou ao cinema!");
    /*se n1 é maior que 14 E n2 igual a 45
                    E
      se n2 for maior que n1 OU n1 maior ou igual a 15              
    
    */
}else if((n1>14 && n2==45) && (n2>n1 || n1>=15)){
    console.log("Vou ao shopping!")
}


// OBJETO CARRO

let carro = {
    cor: "preto",
    placa: "KHJ8765",
    modelo: "fusca",
    kmRodados: "120000",
    som: "true",
    arcondicionado: "false"
};
console.log(carro.cor+carro.modelo+carro.placa);
