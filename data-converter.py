import pandas as pd


def contains_chinese(text):
    for char in text:
        if "\u4e00" <= char <= "\u9fff":
            return True
    return False


def prune(df: pd.DataFrame):
    df2 = df.copy()
    for index, row in df.iterrows():
        name = row["goal"]
        if pd.isna(name) or not contains_chinese(name) or pd.isna(row["rank"]):
            df2.drop(index, inplace=True)
            continue
    if "hidden notes" in df.columns:
        df2.drop("hidden notes", axis=1, inplace=True)
    if "comments" in df.columns:
        df2.drop("comments", axis=1, inplace=True)
    return df2


def main():
    df = pd.concat(
        [
            prune(pd.read_excel("bingo.xlsx", sheet_name="7-11任务表")),
            prune(pd.read_excel("bingo.xlsx", sheet_name="1-6任务表")),
            prune(pd.read_excel("bingo.xlsx", sheet_name="HSR任务表")),
        ]
    )
    df.to_csv("data.csv", index=False)


if __name__ == "__main__":
    main()
