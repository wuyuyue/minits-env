## introdction

  minits environment including llvm and riscv which is based on docker image for different OS, that is why it took long time to install for the first time

## install

```
npm install minits -g
```

## usage

```
minits help
minits env
minits build *src* -o *dest*
minits run *src*
minits riscv *src* -o *dest*
minits update

```

## dev mode
```
node -r ts-node/register src/cli.ts help

```