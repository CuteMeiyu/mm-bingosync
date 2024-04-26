import pandas as pd
import json


def contains_chinese(text):
    for char in text:
        if "\u4e00" <= char <= "\u9fff":
            return True
    return False


def get_regular_goal_list(df: pd.DataFrame):
    goal_list = []
    for _, row in df.iterrows():
        name = row["goal"]
        if pd.isna(name) or not contains_chinese(name):
            continue
        if pd.isna(row["rank"]):
            continue
        goal = {"name": name, "games": [part.strip() for part in str(row["games"]).replace("，", ",").split(",")]}
        diff = int(row["rank"]) - 1
        if diff > 0:
            goal["diff"] = diff
        if not pd.isna(row["group"]):
            goal["groups"] = [part.strip() for part in str(row["group"]).replace("，", ",").split(",")]
        if not pd.isna(row["type"]):
            goal["mixType"] = str(row["type"])
        if not pd.isna(row["pw"]) and str(row["pw"]).lower() == "y":
            goal["password"] = True
        if not pd.isna(row["notes"]):
            goal["notes"] = str(row["notes"])
        goal_list.append(goal)
    return goal_list


def main():
    df = pd.read_excel("bingo.xlsx", sheet_name="7-11任务表")
    goal_list = get_regular_goal_list(df)

    with open("data.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(goal_list, ensure_ascii=False, indent=4, sort_keys=True))


if __name__ == "__main__":
    main()
