# How to Recover Your Project (ExamCompass)

Since you are moving to a new laptop, here are the exact steps to get your code back using only GitHub.

## 1. On Your New Laptop
1. **Install Git**: Download and install Git from [git-scm.com](https://git-scm.com/).
2. **Install Node.js**: Download and install the LTS version from [nodejs.org](https://nodejs.org/).
3. **Open Terminal**: Open Command Prompt, PowerShell, or any terminal.

## 2. Authenticate with GitHub
Run the following command and follow the instructions to log in:
```bash
gh auth login
```
*If you don't have GitHub CLI (`gh`), you can just log in to GitHub.com in your browser.*

## 3. Download the Project
In your terminal, navigate to the folder where you want to keep the project and run:
```bash
git clone https://github.com/[YOUR_GITHUB_USERNAME]/examcompass.git
```
*Replace `[YOUR_GITHUB_USERNAME]` with your actual GitHub username.*

## 4. Set Up the Project
Navigate into the project folder:
```bash
cd examcompass
```
Install the necessary dependencies:
```bash
npm install
```
*Note: We did not upload `node_modules` because they are very large; `npm install` will recreate them for you.*

## 5. Start Working
```bash
npm run dev
```

**Your code is now safe on GitHub!**
