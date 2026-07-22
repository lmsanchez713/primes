#!/bin/bash
echo Pulling updated primes repository...
cd /primes
git pull --no-rebase
echo Copying and calling the updater script...
cd ~
cp /primes/project-will/scripts/will2lulu.sh ./will2lulu.sh
chmod +x will2lulu.sh
./will2lulu.sh
echo Removing the copied script and exiting...
rm will2lulu.sh