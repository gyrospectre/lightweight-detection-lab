import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';


import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TlogGenStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const windows = ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE);
    const deployPath = "C:\\deploy"

    var instancetype = ec2.InstanceType.of(
      ec2.InstanceClass.T2,
      ec2.InstanceSize.SMALL
    );

    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 1,
    });

    const securityGroup = new ec2.SecurityGroup(this, 'MySG', {
      vpc: vpc
    });

    const s3Bucket = new s3.Bucket(this, 'LDLbucket', {
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, 'DeployFiles', {
      sources: [s3deploy.Source.asset('./deploy')],
      destinationBucket: s3Bucket,
    });

    const awsCli = "cmd.exe /c \"C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe\" "
    const syncLocalToS3 = awsCli + "s3 sync " + deployPath + "\\ s3://" + s3Bucket.bucketName + "/"
    const syncS3ToLocal = awsCli + "s3 sync s3://" + s3Bucket.bucketName + "/ " + deployPath + "\\"

    const initData = ec2.CloudFormationInit.fromElements(
      ec2.InitPackage.msi("https://awscli.amazonaws.com/AWSCLIV2.msi"),

      ec2.InitCommand.shellCommand(syncS3ToLocal, {
        key: "0-copy-deployment",
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(2))
      }),

      ec2.InitCommand.shellCommand('powershell.exe -File ".\\scripts\\Setup.ps1"', { 
        key: "1-sysmon-install",
        cwd: deployPath,
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(2))
      }),

      ec2.InitCommand.shellCommand('cmd.exe /c ".\\tests\\tests.bat"', {
        key: "2-run-tests",
        cwd: deployPath,
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(2))
      }),

      ec2.InitCommand.shellCommand('powershell.exe -File ".\\scripts\\Collect.ps1"', {
        key: "3-collect-logs",
        cwd: deployPath,
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(2))
      }),

      ec2.InitCommand.shellCommand(syncLocalToS3, {
        key: "3-sync-results",
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(2)),
      }),
    )

    var instanceProfile = iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore");

    const role = new iam.Role(this, "bastion-role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    role.addManagedPolicy(instanceProfile);
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [  s3Bucket.bucketArn, s3Bucket.bucketArn + '/*' ],
        actions: [            
          's3:PutObject*',
          's3:GetObject*',
          's3:List*',
        ]
      })
    );

    var instance = new ec2.Instance(this, "tlog-gen-server-instance", {
      vpc: vpc,
      securityGroup: securityGroup,
      instanceName: "tlog-gen-server",
      instanceType: instancetype,
      machineImage: windows,
      init: initData,
      initOptions: {
        timeout: cdk.Duration.minutes(15),
        ignoreFailures: true,
      },
      keyName: "windows",
      role: role,
    })
  }
}
