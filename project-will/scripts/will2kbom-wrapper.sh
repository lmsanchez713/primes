#!/bin/bash
echo Pulling updated primes repository...
cd /primes
git pull --no-rebase
echo Copying and calling the updater script...
cd ~
cp /primes/project-will/scripts/will2kbom.sh ./will2kbom.sh
chmod +x will2kbom.sh
./will2kbom.sh
echo Removing the copied script and exiting...
rm will2kbom.sh