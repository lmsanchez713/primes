#!/bin/bash
echo Pulling updated menezes repository...
cd /menezes
git pull --no-rebase
echo Copying and calling the updater script...
cd ~
cp /menezes/scripts/mnz2lulu.sh ./mnz2lulu.sh
chmod +x mnz2lulu.sh
./mnz2lulu.sh
echo Removing the copied script and exiting...
rm mnz2lulu.sh