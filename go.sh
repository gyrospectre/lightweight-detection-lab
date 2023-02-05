cdk deploy
BUCKET=`aws s3 ls | grep tlog | cut -f3 -d' '`
rm -rf ./out 
aws s3 cp s3://$BUCKET/logs/ out/ --recursive

cdk destroy --force